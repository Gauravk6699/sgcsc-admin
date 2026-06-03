// src/pages/CertificateCreate.jsx
//
// Changes vs original:
//  • centerName is the ONE org field — atcName is just an alias kept for DB compat.
//  • initCertificateGenerator uses the same shared singleton from CertificateList.
//  • Certificate image stored in DB is rendered via the same _render() path
//    so view ↔ download are always consistent.
//  • Removed duplicate loadCertScript blocks.

import { useState, useEffect } from 'react';
import API from "../api/api";

// ── Singleton generator init (mirrors CertificateList) ────────────────────────
let _certGenPromise = null;

function initCertificateGenerator() {
  if (_certGenPromise) return _certGenPromise;

  _certGenPromise = (async () => {
    if (!document.getElementById('certCanvas')) {
      const cv = document.createElement('canvas');
      cv.id = 'certCanvas';
      cv.style.display = 'none';
      document.body.appendChild(cv);
    }

    if (window.CertificateGenerator) {
      await window.CertificateGenerator.loadTemplate('/student-certificate-template.jpeg');
      return window.CertificateGenerator;
    }

    const loadScript = (src) =>
      new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = res;
        s.onerror = () => rej(new Error('Failed to load ' + src));
        document.body.appendChild(s);
      });

    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    if (!window.QRious) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js');
    }
    if (!window.CertificateGenerator) {
      await loadScript('/certificate-generator.js');
    }

    if (window.CertificateGenerator) {
      await window.CertificateGenerator.loadTemplate('/student-certificate-template.jpeg');
      return window.CertificateGenerator;
    }
    throw new Error('CertificateGenerator unavailable.');
  })();

  return _certGenPromise;
}

// ── Duration helper ────────────────────────────────────────────────────────────
function calculateDuration(fromDate, toDate) {
  if (!fromDate || !toDate) return '';
  const from = new Date(fromDate);
  const to   = new Date(toDate);
  if (isNaN(from) || isNaN(to) || to < from) return '';

  let years  = to.getFullYear() - from.getFullYear();
  let months = to.getMonth()    - from.getMonth();
  if (months < 0) { years--; months += 12; }

  const parts = [];
  if (years  > 0) parts.push(`${years} year${years  > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  return parts.join(' ') || '0 months';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CertificateCreate() {
  // Form fields
  const [enrollmentNumber,  setEnrollmentNumber]  = useState('');
  const [name,              setName]              = useState('');
  const [fatherName,        setFatherName]        = useState('');
  const [courseName,        setCourseName]        = useState('');
  const [sessionFrom,       setSessionFrom]       = useState('');
  const [sessionTo,         setSessionTo]         = useState('');
  const [grade,             setGrade]             = useState('');
  const [courseDuration,    setCourseDuration]    = useState('');
  const [coursePeriodFrom,  setCoursePeriodFrom]  = useState('');
  const [coursePeriodTo,    setCoursePeriodTo]    = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issueDate,         setIssueDate]         = useState('');
  // Single org field — replaces the old centerName + atcName pair
  const [centerName,        setCenterName]        = useState('');

  // Supporting state
  const [allStudents,      setAllStudents]      = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredCourses,  setFilteredCourses]  = useState([]);
  const [studentPhoto,     setStudentPhoto]     = useState('');
  const [saving,           setSaving]           = useState(false);
  const [message,          setMessage]          = useState('');
  const [messageType,      setMessageType]      = useState('info');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const studentsRes  = await API.get('/students');
        const studentsData = Array.isArray(studentsRes.data)
          ? studentsRes.data
          : Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : [];
        setAllStudents(studentsData);
        setFilteredStudents(studentsData);
      } catch (err) {
        console.error('[CertCreate] Failed to fetch students:', err);
      }
    };
    fetchInitialData();
    // Pre-warm the generator so the first save isn't slow
    initCertificateGenerator().catch(console.warn);
  }, []);

  // Auto-calculate duration from period dates
  useEffect(() => {
    setCourseDuration(calculateDuration(coursePeriodFrom, coursePeriodTo));
  }, [coursePeriodFrom, coursePeriodTo]);

  // ── Student selection ─────────────────────────────────────────────────────
  const handleStudentSelection = (selectedEnrollment) => {
    setEnrollmentNumber(selectedEnrollment);
    setCourseName('');
    setFilteredCourses([]);

    const student = allStudents.find(s =>
      (s.enrollmentNumber || s.rollNumber) === selectedEnrollment
    );
    if (!student) return;

    setName(student.name         || '');
    setFatherName(student.fatherName || '');
    // Use centerName as the single org field
    setCenterName(student.centerName || student.atcName || student.center || '');
    setStudentPhoto(student.photo || '');

    if (student.courses && Array.isArray(student.courses) && student.courses.length > 0) {
      setFilteredCourses(student.courses.map(c => ({ _id: c._id, name: c.courseName || c.name })));
    } else if (student.courseName) {
      setFilteredCourses([{ _id: student._id, name: student.courseName }]);
    }

    setMessageType('info');
    setMessage('Student selected. Choose a course to auto-fill remaining details.');
  };

  // ── Course selection ──────────────────────────────────────────────────────
  const handleCourseSelection = async (selectedCourseName) => {
    setCourseName(selectedCourseName);
    if (!selectedCourseName || !enrollmentNumber) return;

    const student = allStudents.find(s =>
      (s.enrollmentNumber || s.rollNumber) === enrollmentNumber
    );
    if (!student) return;

    // Try to get grade from marksheet
    let gradeValue = student.grade || '';
    try {
      const res        = await API.get('/marksheets');
      const marksheets = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      const ms = marksheets.find(m =>
        m.enrollmentNo === enrollmentNumber && m.courseName === selectedCourseName
      );
      if (ms) gradeValue = ms.overallGrade || ms.grade || gradeValue;
    } catch (err) {
      console.warn('[CertCreate] Marksheet lookup failed:', err);
    }
    setGrade(gradeValue);

    // Course-level dates
    let courseDetails = null;
    if (student.courses && Array.isArray(student.courses)) {
      courseDetails = student.courses.find(c => (c.courseName || c.name) === selectedCourseName);
    }

    const src = courseDetails || student;
    if (src.sessionStart) {
      setSessionFrom(String(new Date(src.sessionStart).getFullYear()));
      setCoursePeriodFrom(src.sessionStart.split('T')[0]);
    }
    if (src.sessionEnd) {
      setSessionTo(String(new Date(src.sessionEnd).getFullYear()));
      setCoursePeriodTo(src.sessionEnd.split('T')[0]);
    }

    setMessageType('success');
    setMessage('Details auto-filled from student record.');
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const checks = [
      [!enrollmentNumber.trim(),  'Student selection is required.'],
      [!courseName.trim(),        'Course Name is required.'],
      [!name.trim(),              'Name is required.'],
      [!fatherName.trim(),        "Parent's Name is required."],
      [!sessionFrom,              'Session From is required.'],
      [!sessionTo,                'Session To is required.'],
      [!grade.trim(),             'Grade is required.'],
      [!courseDuration.trim(),    'Course Duration is required.'],
      [!coursePeriodFrom,         'Course Period From is required.'],
      [!coursePeriodTo,           'Course Period To is required.'],
      [!certificateNumber.trim(), 'Certificate Number is required.'],
      [!issueDate,                'Issue Date is required.'],
      [!centerName.trim(),        'Center / ATC Name is required.'],
    ];
    for (const [fail, msg] of checks) {
      if (fail) { setMessageType('danger'); setMessage(msg); return false; }
    }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validate()) return;

    setSaving(true);
    try {
      const orgName = centerName.trim();
      const studentNameCombined = `${name.trim()} S/O, D/O, W/O ${fatherName.trim()}`;

      const payload = {
        name:              name.trim(),
        fatherName:        fatherName.trim(),
        courseName:        courseName.trim(),
        sessionFrom:       parseInt(sessionFrom),
        sessionTo:         parseInt(sessionTo),
        grade:             grade.trim(),
        courseDuration:    courseDuration.trim(),
        coursePeriodFrom,
        coursePeriodTo,
        enrollmentNumber:  enrollmentNumber.trim(),
        certificateNumber: certificateNumber.trim(),
        issueDate,
        centerName:        orgName,
        atcName:           orgName,   // keep in sync for DB compat
        photo:             studentPhoto,
      };

      // Save certificate record first
      const saved = await API.unwrap(API.post('/certificates', payload));

      // Generate and store certificate image — same render path as download
      try {
        const gen = await initCertificateGenerator();
        gen.setVerifyBaseUrl('https://sgcsc.in');

        const studentData = {
          centerName:          orgName,
          atcName:             orgName,
          studentNameCombined,
          courseName:          payload.courseName,
          grade:               payload.grade,
          courseDuration:      payload.courseDuration,
          coursePeriodFrom:    payload.coursePeriodFrom,
          coursePeriodTo:      payload.coursePeriodTo,
          certificateNumber:   payload.certificateNumber,
          dateOfIssue:         payload.issueDate,
          photo:               payload.photo,
        };

        // Store compressed preview (0.4) — display uses live re-render anyway
        const certificateImage = await gen.getDataURL(studentData, 0.4);
        await API.put(`/certificates/${saved._id || saved.id}`, { certificateImage });
      } catch (imgErr) {
        console.error('[CertCreate] Image generation failed:', imgErr);
      }

      setMessageType('success');
      setMessage('Certificate created successfully.');

      // Reset form
      setEnrollmentNumber(''); setName(''); setFatherName(''); setCenterName('');
      setCourseName(''); setSessionFrom(''); setSessionTo(''); setGrade('');
      setCourseDuration(''); setCoursePeriodFrom(''); setCoursePeriodTo('');
      setCertificateNumber(''); setIssueDate(''); setStudentPhoto('');
      setFilteredCourses([]);
    } catch (err) {
      console.error('[CertCreate] Submit error:', err);
      setMessageType('danger');
      setMessage(err.userMessage || 'Failed to create certificate');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-4 fw-bold">Create Student Certificate</h2>

          {message && (
            <div className={`alert alert-${messageType === 'danger' ? 'danger' : messageType === 'success' ? 'success' : 'info'}`}>
              {message}
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">

                {/* Student */}
                <div className="col-md-6">
                  <label className="form-label">Student *</label>
                  <select
                    className="form-select"
                    value={enrollmentNumber}
                    onChange={e => handleStudentSelection(e.target.value)}
                    required
                  >
                    <option value="">Select Student</option>
                    {filteredStudents.map(s => (
                      <option key={s._id || s.enrollmentNumber} value={s.enrollmentNumber || s.rollNumber}>
                        {s.name} ({s.enrollmentNumber || s.rollNumber})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Select student to filter courses</small>
                </div>

                {/* Course */}
                <div className="col-md-6">
                  <label className="form-label">Course Name *</label>
                  <select
                    className="form-select"
                    value={courseName}
                    onChange={e => handleCourseSelection(e.target.value)}
                    required
                    disabled={!enrollmentNumber}
                  >
                    <option value="">Select Course</option>
                    {filteredCourses.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <small className="text-muted">{filteredCourses.length} course(s) available</small>
                </div>

                {/* Single org field */}
                <div className="col-md-6">
                  <label className="form-label">Center / ATC Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={centerName}
                    onChange={e => setCenterName(e.target.value)}
                    placeholder="e.g. SGCSC Training Center"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Name *</label>
                  <input type="text" className="form-control" value={name}
                    onChange={e => setName(e.target.value)} required />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Parent's Name *</label>
                  <input type="text" className="form-control" value={fatherName}
                    onChange={e => setFatherName(e.target.value)} required />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Session From *</label>
                  <select className="form-select" value={sessionFrom}
                    onChange={e => setSessionFrom(e.target.value)} required>
                    <option value="">Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Session To *</label>
                  <select className="form-select" value={sessionTo}
                    onChange={e => setSessionTo(e.target.value)} required>
                    <option value="">Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Grade *</label>
                  <input type="text" className="form-control" value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="e.g. A, A+, First Division" required />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course Duration *</label>
                  <input type="text" className="form-control" value={courseDuration}
                    readOnly placeholder="Auto-calculated from period dates" />
                  <small className="text-muted">Calculated from Course Period dates</small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course Period From *</label>
                  <input type="date" className="form-control" value={coursePeriodFrom}
                    onChange={e => setCoursePeriodFrom(e.target.value)} required />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course Period To *</label>
                  <input type="date" className="form-control" value={coursePeriodTo}
                    onChange={e => setCoursePeriodTo(e.target.value)} required />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Certificate Number *</label>
                  <input type="text" className="form-control" value={certificateNumber}
                    onChange={e => setCertificateNumber(e.target.value)} required />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Issue Date *</label>
                  <input type="date" className="form-control" value={issueDate}
                    onChange={e => setIssueDate(e.target.value)} required />
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                    {saving ? 'Saving…' : 'Create Certificate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for CertificateGenerator */}
      <canvas id="certCanvas" style={{ display: 'none' }} />
    </div>
  );
}