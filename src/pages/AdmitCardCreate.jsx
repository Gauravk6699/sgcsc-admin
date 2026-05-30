// src/pages/AdmitCardCreate.jsx
import { useEffect, useState } from 'react';
import API from "../api/axiosInstance";

export default function AdmitCardCreate() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Form fields
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [examCenterAddress, setExamCenterAddress] = useState('');
  
  // Exam schedule fields
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [reportingTime, setReportingTime] = useState('');
  const [examDuration, setExamDuration] = useState('');

  // Optional links
  const [courseId, setCourseId] = useState('');
  const [studentId, setStudentId] = useState('');

  const [loadingLists, setLoadingLists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'info' | 'success' | 'danger'

  // Load students + courses on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingLists(true);
      setMessage('');

      try {
        const [studentsData, coursesData] = await Promise.all([
          API.unwrap(API.get('/students')),
          API.unwrap(API.get('/courses')),
        ]);

        const stuArr = Array.isArray(studentsData)
          ? studentsData
          : Array.isArray(studentsData?.data)
          ? studentsData.data
          : [];

        const courseArr = Array.isArray(coursesData)
          ? coursesData
          : Array.isArray(coursesData?.data)
          ? coursesData.data
          : [];

        setStudents(stuArr);
        setCourses(courseArr);
      } catch (err) {
        console.error('load students/courses error (admit card):', err);
        setMessageType('danger');
        setMessage(
          err.userMessage || 'Failed to load students or courses. Check API.'
        );
      } finally {
        setLoadingLists(false);
      }
    };

    fetchData();
  }, []);

  const validate = () => {
    if (!rollNumber.trim()) {
      setMessageType('danger');
      setMessage('Roll Number is required.');
      return false;
    }
    if (!studentName.trim()) {
      setMessageType('danger');
      setMessage('Student Name is required.');
      return false;
    }
    if (!fatherName.trim()) {
      setMessageType('danger');
      setMessage('Father Name is required.');
      return false;
    }
    if (!motherName.trim()) {
      setMessageType('danger');
      setMessage('Mother Name is required.');
      return false;
    }
    if (!courseName.trim()) {
      setMessageType('danger');
      setMessage('Course Name is required.');
      return false;
    }
    if (!instituteName.trim()) {
      setMessageType('danger');
      setMessage('Institute Name is required.');
      return false;
    }
    if (!examCenterAddress.trim()) {
      setMessageType('danger');
      setMessage('Exam Center Address is required.');
      return false;
    }
    if (!examDate) {
      setMessageType('danger');
      setMessage('Exam Date is required.');
      return false;
    }
    if (!examTime.trim()) {
      setMessageType('danger');
      setMessage('Exam Time is required.');
      return false;
    }
    if (!reportingTime.trim()) {
      setMessageType('danger');
      setMessage('Reporting Time is required.');
      return false;
    }
    if (!examDuration.trim()) {
      setMessageType('danger');
      setMessage('Exam Duration is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validate()) return;

    setSaving(true);

    try {
      const payload = {
        rollNumber: rollNumber.trim(),
        studentName: studentName.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        courseName: courseName.trim(),
        instituteName: instituteName.trim(),
        examCenterAddress: examCenterAddress.trim(),
        examDate,
        examTime: examTime.trim(),
        reportingTime: reportingTime.trim(),
        examDuration: examDuration.trim(),
        courseId: courseId || undefined,
        studentId: studentId || undefined,
      };

      await API.unwrap(API.post('/admit-cards', payload));

      setMessageType('success');
      setMessage('Admit Card created successfully.');

      // Reset form
      setRollNumber('');
      setStudentName('');
      setFatherName('');
      setMotherName('');
      setCourseName('');
      setInstituteName('');
      setExamCenterAddress('');
      setExamDate('');
      setExamTime('');
      setReportingTime('');
      setExamDuration('');
      setCourseId('');
      setStudentId('');
    } catch (err) {
      console.error('create admit card error:', err);
      setMessageType('danger');
      setMessage(err.userMessage || 'Failed to create admit card');
    } finally {
      setSaving(false);
    }
  };

  // Handle course selection to auto-fill course name
  const handleCourseChange = (e) => {
    const selectedCourseId = e.target.value;
    setCourseId(selectedCourseId);
    
    if (selectedCourseId) {
      const selectedCourse = courses.find((c) => (c._id || c.id) === selectedCourseId);
      if (selectedCourse) {
        setCourseName(selectedCourse.name || selectedCourse.title || '');
      }
    }
  };

  // Handle student selection to auto-fill student details
  const handleStudentChange = (e) => {
    const selectedStudentId = e.target.value;
    setStudentId(selectedStudentId);
    
    if (selectedStudentId) {
      const selectedStudent = students.find((s) => (s._id || s.id) === selectedStudentId);
      if (selectedStudent) {
        if (selectedStudent.name) setStudentName(selectedStudent.name);
        if (selectedStudent.fatherName) setFatherName(selectedStudent.fatherName);
        if (selectedStudent.motherName) setMotherName(selectedStudent.motherName);
        if (selectedStudent.rollNumber) setRollNumber(selectedStudent.rollNumber);
      }
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-4 fw-bold">Generate Admit Card</h2>

          {message && (
            <div
              className={`alert alert-${
                messageType === 'danger'
                  ? 'danger'
                  : messageType === 'success'
                  ? 'success'
                  : 'info'
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          <div className="card shadow-sm" style={{ maxWidth: 800 }}>
            <div className="card-body">
              {loadingLists ? (
                <div className="text-muted">Loading students and courses…</div>
              ) : (
                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-12">
                    <h5 className="mb-3 text-primary">Student Details</h5>
                  </div>

                  {/* Student Selection (optional - for auto-fill) */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Select Student (optional - auto-fills details)
                    </label>
                    <select
                      className="form-select"
                      value={studentId}
                      onChange={handleStudentChange}
                    >
                      <option value="">Select a student</option>
                      {students.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.name || s.fullName || 'Student'}{' '}
                          {s.rollNumber ? `(${s.rollNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Roll Number */}
                  <div className="col-md-6">
                    <label className="form-label">Roll Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="Enter roll number"
                      required
                      readOnly
                    />
                  </div>

                  {/* Student Name */}
                  <div className="col-md-6">
                    <label className="form-label">Student Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter student name"
                      required
                      readOnly
                    />
                  </div>

                  {/* Father Name */}
                  <div className="col-md-6">
                    <label className="form-label">Father Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Enter father name"
                      required
                    />
                  </div>

                  {/* Mother Name */}
                  <div className="col-md-6">
                    <label className="form-label">Mother Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="Enter mother name"
                      required
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <h5 className="mb-3 text-primary">Course & Institute Details</h5>
                  </div>

                  {/* Course Selection (optional - for auto-fill) */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Select Course (optional - auto-fills course name)
                    </label>
                    <select
                      className="form-select"
                      value={courseId}
                      onChange={handleCourseChange}
                    >
                      <option value="">Select a course</option>
                      {courses.map((c) => (
                        <option key={c._id || c.id} value={c._id || c.id}>
                          {c.name || c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course Name */}
                  <div className="col-md-6">
                    <label className="form-label">Course Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Enter course name"
                      required
                    />
                  </div>

                  {/* Institute Name */}
                  <div className="col-md-6">
                    <label className="form-label">Institute Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      placeholder="Enter institute name"
                      required
                    />
                  </div>

                  {/* Exam Center Address */}
                  <div className="col-md-6">
                    <label className="form-label">Exam Center Address *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={examCenterAddress}
                      onChange={(e) => setExamCenterAddress(e.target.value)}
                      placeholder="Enter exam center address"
                      required
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <h5 className="mb-3 text-primary">Exam Schedule</h5>
                  </div>

                  {/* Exam Date */}
                  <div className="col-md-3">
                    <label className="form-label">Exam Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Exam Time */}
                  <div className="col-md-3">
                    <label className="form-label">Exam Time *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      placeholder="e.g. 10:00 AM - 12:00 PM"
                      required
                    />
                  </div>

                  {/* Reporting Time */}
                  <div className="col-md-3">
                    <label className="form-label">Reporting Time *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={reportingTime}
                      onChange={(e) => setReportingTime(e.target.value)}
                      placeholder="e.g. 09:00 AM"
                      required
                    />
                  </div>

                  {/* Exam Duration */}
                  <div className="col-md-3">
                    <label className="form-label">Exam Duration *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={examDuration}
                      onChange={(e) => setExamDuration(e.target.value)}
                      placeholder="e.g. 2 Hours"
                      required
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={saving || loadingLists}
                    >
                      {saving ? 'Generating Admit Card...' : 'Generate Admit Card'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
