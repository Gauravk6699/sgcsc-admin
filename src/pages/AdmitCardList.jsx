// src/pages/AdmitCardList.jsx
import { useEffect, useMemo, useState } from 'react';
import API from "../api/axiosInstance";

// eslint-disable-next-line no-undef
const AdmitCardGenerator = window.AdmitCardGenerator;

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-IN');
}

function AdmitCardModal({ show, onClose, onSaved, initial, courses }) {
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [examCenterAddress, setExamCenterAddress] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [reportingTime, setReportingTime] = useState('');
  const [examDuration, setExamDuration] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    if (!show) return;

    setError('');
    setSaving(false);

    if (initial) {
      setRollNumber(initial.rollNumber || '');
      setStudentName(initial.studentName || '');
      setFatherName(initial.fatherName || '');
      setMotherName(initial.motherName || '');
      setCourseName(initial.courseName || '');
      setInstituteName(initial.instituteName || '');
      setExamCenterAddress(initial.examCenterAddress || '');
      setExamDate(
        initial.examDate ? new Date(initial.examDate).toISOString().slice(0, 10) : ''
      );
      setExamTime(initial.examTime || '');
      setReportingTime(initial.reportingTime || '');
      setExamDuration(initial.examDuration || '');
    } else {
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
      setStudentId(null);
    }
  }, [show, initial]);

  // Fetch students for dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await API.get('/students');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStudents(list);
      } catch (err) {
        console.error('fetch students error:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (show) {
      fetchStudents();
    }
  }, [show]);

  // Handle student selection from dropdown
  const handleStudentSelect = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (!student) return;

    console.log('Selected student:', student);
    console.log('Student rollNumber:', student.rollNumber);
    console.log('Setting rollNumber to:', student.rollNumber || '');

    setRollNumber(student.rollNumber || '');
    setStudentName(student.name || '');
    setFatherName(student.fatherName || '');
    setMotherName(student.motherName || '');
    setCourseName(student.courseName || '');
    setStudentId(student._id);
  };

  if (!show) return null;

  const validate = () => {
    if (!rollNumber.trim()) {
      setError('Roll Number is required.');
      return false;
    }
    if (!studentName.trim()) {
      setError('Student Name is required.');
      return false;
    }
    if (!fatherName.trim()) {
      setError('Father Name is required.');
      return false;
    }
    if (!motherName.trim()) {
      setError('Mother Name is required.');
      return false;
    }
    if (!courseName.trim()) {
      setError('Course Name is required.');
      return false;
    }
    if (!instituteName.trim()) {
      setError('Institute Name is required.');
      return false;
    }
    if (!examCenterAddress.trim()) {
      setError('Exam Center Address is required.');
      return false;
    }
    if (!examDate) {
      setError('Exam Date is required.');
      return false;
    }
    if (!examTime.trim()) {
      setError('Exam Time is required.');
      return false;
    }
    if (!reportingTime.trim()) {
      setError('Reporting Time is required.');
      return false;
    }
    if (!examDuration.trim()) {
      setError('Exam Duration is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      };

      let saved;
      if (initial && (initial._id || initial.id)) {
        const id = initial._id || initial.id;
        saved = await API.unwrap(API.put(`/admit-cards/${id}`, payload));
      } else {
        saved = await API.unwrap(API.post('/admit-cards', payload));
      }

      onSaved(saved);
    } catch (err) {
      console.error('save admit card error:', err);
      setError(err.userMessage || 'Failed to save admit card');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">
                {initial ? 'Edit Admit Card' : 'Create Admit Card'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={saving}
              />
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

               <div className="row g-3">
                 <div className="col-12">
                   <h6 className="text-primary">Student Details</h6>
                 </div>

                 <div className="col-12">
                   <label className="form-label">Select Student *</label>
                    <select
                      className="form-select"
                      value={studentId || ''}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      disabled={loadingStudents}
                      required
                    >
                     <option value="">
                       {loadingStudents ? "Loading students..." : "Select a student"}
                     </option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.rollNumber || s.enrollmentNo}) - {s.courseName || "No Course"}
                        </option>
                      ))}
                   </select>
                 </div>

                 <div className="col-md-6">
                   <label className="form-label">Roll Number *</label>
                   <input
                     type="text"
                     className="form-control"
                     value={rollNumber}
                     onChange={(e) => setRollNumber(e.target.value)}
                     required
                     readOnly
                   />
                 </div>

                 <div className="col-md-6">
                   <label className="form-label">Student Name *</label>
                   <input
                     type="text"
                     className="form-control"
                     value={studentName}
                     onChange={(e) => setStudentName(e.target.value)}
                     required
                     readOnly
                   />
                 </div>

                <div className="col-md-6">
                  <label className="form-label">Father Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                  />
                </div>

                  <div className="col-md-6">
                    <label className="form-label">Roll Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      required
                      readOnly
                    />
                  </div>

                <div className="col-12 mt-3">
                  <h6 className="text-primary">Course & Institute Details</h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Institute Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label">Exam Center Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={examCenterAddress}
                    onChange={(e) => setExamCenterAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 mt-3">
                  <h6 className="text-primary">Exam Schedule</h6>
                </div>

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
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Function to generate PDF content as HTML and open in new window for printing
const generateAdmitCardPDF = (card) => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  
  if (!printWindow) {
    alert('Please allow popups to print the admit card');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admit Card - ${card.rollNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
        }
        .admit-card {
          max-width: 700px;
          margin: 0 auto;
          border: 2px solid #333;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header h2 {
          font-size: 18px;
          color: #666;
        }
        .title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          text-decoration: underline;
        }
        .details {
          display: table;
          width: 100%;
        }
        .detail-row {
          display: table-row;
        }
        .detail-label {
          display: table-cell;
          padding: 8px 5px;
          font-weight: bold;
          width: 40%;
        }
        .detail-value {
          display: table-cell;
          padding: 8px 5px;
          border-bottom: 1px solid #ddd;
        }
        .exam-schedule {
          margin-top: 25px;
          padding: 15px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
        }
        .exam-schedule h3 {
          font-size: 16px;
          margin-bottom: 10px;
          text-align: center;
        }
        .schedule-grid {
          display: table;
          width: 100%;
        }
        .schedule-row {
          display: table-row;
        }
        .schedule-label {
          display: table-cell;
          padding: 5px;
          font-weight: bold;
        }
        .schedule-value {
          display: table-cell;
          padding: 5px;
        }
        .footer {
          margin-top: 25px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 12px;
        }
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 16px;
        }
        @media print {
          .print-btn {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Print Admit Card</button>
      <div class="admit-card">
        <div class="header">
          <h1>${card.instituteName || 'Institute Name'}</h1>
          <h2>ADMIT CARD</h2>
        </div>
        
        <div class="title">Examination Details</div>
        
        <div class="details">
          <div class="detail-row">
            <div class="detail-label">Roll Number:</div>
            <div class="detail-value">${card.rollNumber || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Student Name:</div>
            <div class="detail-value">${card.studentName || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Father Name:</div>
            <div class="detail-value">${card.fatherName || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Mother Name:</div>
            <div class="detail-value">${card.motherName || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Course Name:</div>
            <div class="detail-value">${card.courseName || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Institute Name:</div>
            <div class="detail-value">${card.instituteName || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Exam Center Address:</div>
            <div class="detail-value">${card.examCenterAddress || '-'}</div>
          </div>
        </div>
        
        <div class="exam-schedule">
          <h3>Exam Schedule</h3>
          <div class="schedule-grid">
            <div class="schedule-row">
              <div class="schedule-label">Exam Date:</div>
              <div class="schedule-value">${fmtDate(card.examDate)}</div>
            </div>
            <div class="schedule-row">
              <div class="schedule-label">Exam Time:</div>
              <div class="schedule-value">${card.examTime || '-'}</div>
            </div>
            <div class="schedule-row">
              <div class="schedule-label">Reporting Time:</div>
              <div class="schedule-value">${card.reportingTime || '-'}</div>
            </div>
            <div class="schedule-row">
              <div class="schedule-label">Exam Duration:</div>
              <div class="schedule-value">${card.examDuration || '-'}</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="signature">
            <div class="signature-line">Candidate Signature</div>
          </div>
          <div class="signature">
            <div class="signature-line">Authorized Signature</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export default function AdmitCardList() {
  const [cards, setCards] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setMsg('');
    try {
      const [cardsData, coursesData, studentsData] = await Promise.all([
        API.unwrap(API.get('/admit-cards')),
        API.unwrap(API.get('/courses')),
        API.unwrap(API.get('/students')),
      ]);

      const cardArr = Array.isArray(cardsData)
        ? cardsData
        : Array.isArray(cardsData?.data)
        ? cardsData.data
        : [];

      const courseArr = Array.isArray(coursesData)
        ? coursesData
        : Array.isArray(coursesData?.data)
        ? coursesData.data
        : [];

      const studentArr = Array.isArray(studentsData)
        ? studentsData
        : Array.isArray(studentsData?.data)
        ? studentsData.data
        : [];

      // Create a map of student name -> photo for quick lookup
      const studentPhotoMap = {};
      studentArr.forEach(s => {
        if (s.name) {
          studentPhotoMap[s.name.toLowerCase()] = s.photo || null;
        }
        // Also map by rollNumber
        if (s.rollNumber) {
          studentPhotoMap[s.rollNumber.toLowerCase()] = s.photo || null;
        }
      });

      // Add student photo to each admit card
      const cardsWithPhotos = cardArr.map(card => ({
        ...card,
        studentPhoto: card.studentName ? studentPhotoMap[card.studentName.toLowerCase()] || null : null
      }));

      setCards(cardsWithPhotos);
      setCourses(courseArr);
    } catch (err) {
      console.error('fetch admit cards', err);
      setMsg(err.userMessage || 'Failed to load admit cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Initialize Admit Card Generator on mount
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  
  useEffect(() => {
    const initGenerator = async () => {
      if (typeof AdmitCardGenerator !== 'undefined') {
        try {
          console.log('Loading admit card template...');
          await AdmitCardGenerator.loadTemplate('/admit-card-template.jpeg');
          console.log('Admit card template loaded successfully');
          setTemplateLoaded(true);
        } catch (err) {
          console.error('Failed to load admit card template:', err);
          setTemplateError(err.message);
        }
      } else {
        console.warn('AdmitCardGenerator not defined');
      }
    };
    initGenerator();
  }, []);

  // Function to handle download using template-based generator
  const handleTemplateDownload = (card) => {
    console.log('handleTemplateDownload called:', { templateLoaded, templateError, card });
    if (typeof AdmitCardGenerator !== 'undefined' && templateLoaded) {
      try {
        AdmitCardGenerator.download({
          rollNumber: card.rollNumber,
          studentName: card.studentName,
          fatherName: card.fatherName,
          motherName: card.motherName,
          courseName: card.courseName,
          instituteName: card.instituteName,
          examCenterAddress: card.examCenterAddress,
          examDate: card.examDate,
          examTime: card.examTime,
          reportingTime: card.reportingTime,
          examDuration: card.examDuration,
          photo: card.studentPhoto || null
        });
      } catch (err) {
        console.error('Error generating PDF:', err);
        // Fallback to HTML-based generation
        generateAdmitCardPDF(card);
      }
    } else {
      console.warn('Template not loaded, using fallback');
      // Fallback to HTML-based generation
      generateAdmitCardPDF(card);
    }
  };

  const filteredCards = useMemo(() => {
    if (!search.trim()) return cards;
    const s = search.trim().toLowerCase();
    return cards.filter((c) => {
      return (
        (c.rollNumber || '').toLowerCase().includes(s) ||
        (c.studentName || '').toLowerCase().includes(s) ||
        (c.courseName || '').toLowerCase().includes(s) ||
        (c.instituteName || '').toLowerCase().includes(s) ||
        (c.examCenterAddress || '').toLowerCase().includes(s)
      );
    });
  }, [cards, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admit card?')) return;
    try {
      await API.delete(`/admit-cards/${id}`);
      setCards((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setMsg('Admit card deleted.');
    } catch (err) {
      console.error('delete admit card error:', err);
      setMsg(err.userMessage || 'Failed to delete admit card');
    }
  };

  const handleEdit = (card) => {
    setEditing(card);
    setShowModal(true);
  };

  const handleDownload = (card) => {
    handleTemplateDownload(card);
  };

  const handleSaved = (saved) => {
    if (!saved || !saved._id) {
      setShowModal(false);
      loadAll();
      return;
    }

    setCards((prev) => {
      const idx = prev.findIndex((c) => (c._id || c.id) === (saved._id || saved.id));
      if (idx === -1) return [saved, ...prev];
      const copy = [...prev];
      copy[idx] = saved;
      return copy;
    });

    setShowModal(false);
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="mb-0">Admit Cards</h2>
              <div className="small text-muted">
                List, search, edit, download and delete admit cards
              </div>
            </div>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: 240 }}
                placeholder="Search by roll / name / course"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={loadAll}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {msg && <div className="alert alert-info">{msg}</div>}

          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center text-muted">
                  Loading admit cards…
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No admit cards found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Roll No.</th>
                        <th>Student Name</th>
                        <th>Course</th>
                        <th>Institute</th>
                        <th>Exam Date</th>
                        <th>Exam Time</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCards.map((c) => (
                        <tr key={c._id || c.id}>
                          <td>{c.rollNumber}</td>
                          <td>{c.studentName || '-'}</td>
                          <td>{c.courseName || '-'}</td>
                          <td>{c.instituteName || '-'}</td>
                          <td>{fmtDate(c.examDate)}</td>
                          <td>{c.examTime || '-'}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-success me-2"
                              onClick={() => handleDownload(c)}
                              title="Download/Print Admit Card"
                            >
                              Download
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleEdit(c)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDelete(c._id || c.id)
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AdmitCardModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing}
        courses={courses}
      />
      
      {/* Hidden canvas for template-based admit card generation */}
      <canvas id="admitCardCanvas" style={{ display: 'none' }}></canvas>
    </div>
  );
}
