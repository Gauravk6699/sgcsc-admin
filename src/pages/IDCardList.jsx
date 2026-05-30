// src/pages/IDCardList.jsx
import { useEffect, useMemo, useState } from 'react';
import API from "../api/axiosInstance";

// eslint-disable-next-line no-undef
const IDCardGenerator = window.IDCardGenerator;

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-IN');
}

// ─── IDCardViewModal ──────────────────────────────────────────────────────────

function IDCardViewModal({ show, onClose, card }) {
  if (!show || !card) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">ID Card Details - {card.studentName}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h6 className="mb-0">Student Information</h6>
                  </div>
                  <div className="card-body">
                    <p><strong>Student Name:</strong> {card.studentName}</p>
                    <p><strong>Father Name:</strong> {card.fatherName}</p>
                    <p><strong>Mother Name:</strong> {card.motherName || '-'}</p>
                    <p><strong>Enrollment No:</strong> {card.enrollmentNo}</p>
                    <p><strong>Date of Birth:</strong> {fmtDate(card.dateOfBirth)}</p>
                    <p><strong>Mobile No:</strong> {card.mobileNo}</p>
                    <p><strong>Contact No:</strong> {card.contactNo || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-success text-white">
                    <h6 className="mb-0">Course & Center Information</h6>
                  </div>
                  <div className="card-body">
                    <p><strong>Course Name:</strong> {card.courseName}</p>
                    <p><strong>Center Name:</strong> {card.centerName}</p>
                    <p><strong>Session From:</strong> {fmtDate(card.sessionFrom)}</p>
                    <p><strong>Session To:</strong> {fmtDate(card.sessionTo)}</p>
                    <p><strong>Center Mobile:</strong> {card.centerMobileNo || '-'}</p>
                    <p><strong>Address:</strong> {card.address}</p>
                  </div>
                </div>
              </div>
            </div>
            {card.studentPhoto && (
              <div className="row mt-3">
                <div className="col-12 text-center">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Student Photo</h6>
                    </div>
                    <div className="card-body text-center">
                      <img
                        src={card.studentPhoto}
                        alt="Student"
                        className="img-fluid rounded"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── IDCardModal ──────────────────────────────────────────────────────────────

function IDCardModal({ show, onClose, onSaved, initial }) {
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [centerMobileNo, setCenterMobileNo] = useState('');
  const [courseName, setCourseName] = useState('');
  const [centerName, setCenterName] = useState('');
  const [sessionFrom, setSessionFrom] = useState('');
  const [sessionTo, setSessionTo] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

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
  const handleStudentSelect = (selectedId) => {
    const student = students.find(s => s._id === selectedId);
    if (!student) return;

    setStudentName(student.name || '');
    setFatherName(student.fatherName || '');
    setMotherName(student.motherName || '');
    setEnrollmentNo(student.enrollmentNo || student.rollNumber || '');
    setDateOfBirth(student.dob ? new Date(student.dob).toISOString().slice(0, 10) : '');
    setContactNo(student.mobile || '');
    setAddress(student.address || '');
    setMobileNo(student.mobile || '');
    setCenterName(student.centerName || '');
    setStudentId(student._id || null);
    setStudentPhoto(student.photo || null);

    if (student.courses && student.courses.length > 0) {
      const courseNames = student.courses.map(c => c.courseName || c.course || c.name || '').filter(Boolean);
      setAvailableCourses(courseNames);
      setCourseName(courseNames.length === 1 ? courseNames[0] : '');
    } else if (student.courseName) {
      setAvailableCourses([student.courseName]);
      setCourseName(student.courseName);
    } else {
      setAvailableCourses([]);
      setCourseName('');
    }
  };

  // Auto-fill student data by enrollment number
  const handleEnrollmentLookup = async (enrollmentNumber) => {
    if (!enrollmentNumber || enrollmentNumber.length < 3) return;

    setLoadingStudent(true);
    try {
      const res = await API.get('/students');
      const allStudents = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];

      const student = allStudents.find(s =>
        (s.enrollmentNumber || s.rollNumber || '').toLowerCase() === enrollmentNumber.trim().toLowerCase()
      );

      if (!student) {
        setError('Student not found. Please check the enrollment number.');
        return;
      }

      setStudentName(student.name || '');
      setFatherName(student.fatherName || '');
      setMotherName(student.motherName || '');
      setEnrollmentNo(student.enrollmentNo || student.rollNumber || '');
      setDateOfBirth(student.dob ? new Date(student.dob).toISOString().slice(0, 10) : '');
      setContactNo(student.mobile || '');
      setAddress(student.address || '');
      setMobileNo(student.mobile || '');
      setCenterName(student.centerName || '');
      setStudentId(student._id || null);
      setStudentPhoto(student.photo || null);

      if (student.courses && student.courses.length > 0) {
        const courseNames = student.courses.map(c => c.courseName || c.course || c.name || '').filter(Boolean);
        setAvailableCourses(courseNames);
        setCourseName(courseNames.length === 1 ? courseNames[0] : '');
      } else if (student.courseName) {
        setAvailableCourses([student.courseName]);
        setCourseName(student.courseName);
      } else {
        setAvailableCourses([]);
        setCourseName('');
      }
    } catch (err) {
      console.log('Student not found for enrollment:', enrollmentNumber, err);
    } finally {
      setLoadingStudent(false);
    }
  };

  useEffect(() => {
    if (!show) return;

    setError('');
    setSaving(false);

    if (initial) {
      setStudentName(initial.studentName || '');
      setFatherName(initial.fatherName || '');
      setMotherName(initial.motherName || '');
      setEnrollmentNo(initial.enrollmentNo || '');
      setDateOfBirth(
        initial.dateOfBirth ? new Date(initial.dateOfBirth).toISOString().slice(0, 10) : ''
      );
      setContactNo(initial.contactNo || '');
      setAddress(initial.address || '');
      setMobileNo(initial.mobileNo || '');
      setCenterMobileNo(initial.centerMobileNo || '');
      setCourseName(initial.courseName || '');
      setCenterName(initial.centerName || '');
    } else {
      setStudentName('');
      setFatherName('');
      setMotherName('');
      setEnrollmentNo('');
      setDateOfBirth('');
      setContactNo('');
      setAddress('');
      setMobileNo('');
      setCenterMobileNo('');
      setCourseName('');
      setCenterName('');
      setSessionFrom('');
      setSessionTo('');
      setAvailableCourses([]);
      setStudentId(null);
      setStudentPhoto(null);
    }
  }, [show, initial]);

  if (!show) return null;

  const validate = () => {
    if (!studentName.trim()) { setError('Student Name is required.'); return false; }
    if (!fatherName.trim())  { setError('Father Name is required.');  return false; }
    if (!motherName.trim())  { setError('Mother Name is required.');  return false; }
    if (!enrollmentNo.trim()) { setError('Enrollment Number is required.'); return false; }
    if (!dateOfBirth)         { setError('Date of Birth is required.');     return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = {
        studentName: studentName.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        enrollmentNo: enrollmentNo.trim(),
        dateOfBirth,
        contactNo: contactNo.trim(),
        address: address.trim(),
        mobileNo: mobileNo.trim(),
        centerMobileNo: centerMobileNo.trim(),
        courseName: courseName.trim(),
        centerName: centerName.trim(),
        sessionFrom: sessionFrom.trim(),
        sessionTo: sessionTo.trim(),
        student: studentId,
        photo: studentPhoto,
      };

      let saved;
      if (initial && (initial._id || initial.id)) {
        const id = initial._id || initial.id;
        saved = await API.unwrap(API.put(`/id-cards/${id}`, payload));
      } else {
        saved = await API.unwrap(API.post('/id-cards', payload));
      }

      onSaved(saved);
    } catch (err) {
      console.error('save ID card error:', err);
      setError(err.userMessage || 'Failed to save ID card');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`modal ${show ? 'show' : ''}`} style={{ display: show ? 'block' : 'none' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{initial ? 'Edit' : 'Create'} ID Card</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Select Student *</label>
                  <select
                    className="form-select"
                    value={studentId || ''}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    disabled={loadingStudents}
                    required
                  >
                    <option value="">
                      {loadingStudents ? 'Loading students...' : 'Select a student'}
                    </option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.rollNumber || s.enrollmentNo}) - {s.courseName || 'No Course'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
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
                <div className="col-md-6 mb-3">
                  <label className="form-label">Father Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Mother Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Enrollment Number *</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={enrollmentNo}
                      onChange={(e) => {
                        setEnrollmentNo(e.target.value);
                        if (e.target.value.length >= 3) {
                          handleEnrollmentLookup(e.target.value);
                        }
                      }}
                      required
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => handleEnrollmentLookup(enrollmentNo)}
                      disabled={loadingStudent || !enrollmentNo}
                    >
                      {loadingStudent ? 'Searching...' : '🔍'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Contact No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Centre Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={centerMobileNo}
                    onChange={(e) => setCenterMobileNo(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Course Name</label>
                  {availableCourses.length > 1 ? (
                    <select
                      className="form-control"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                    >
                      <option value="">Select a course</option>
                      {availableCourses.map((course, index) => (
                        <option key={index} value={course}>{course}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Centre Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Session From</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sessionFrom}
                    onChange={(e) => setSessionFrom(e.target.value)}
                    placeholder="e.g. 2024"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Session To</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sessionTo}
                    onChange={(e) => setSessionTo(e.target.value)}
                    placeholder="e.g. 2025"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── IDCardList (default export) ──────────────────────────────────────────────

function IDCardList() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCard, setViewingCard] = useState(null);
  const [editing, setEditing] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const [templateLoaded, setTemplateLoaded] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [templateError, setTemplateError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setMsg('');
    try {
      const [cardsData, studentsData] = await Promise.all([
        API.unwrap(API.get('/id-cards')),
        API.unwrap(API.get('/students')),
      ]);

      const cardArr = Array.isArray(cardsData)
        ? cardsData
        : Array.isArray(cardsData?.data) ? cardsData.data : [];

      const studentArr = Array.isArray(studentsData)
        ? studentsData
        : Array.isArray(studentsData?.data) ? studentsData.data : [];

      // Build photo lookup map (by _id, name, and enrollmentNo)
      const studentPhotoMap = {};
      studentArr.forEach(s => {
        if (s._id)        studentPhotoMap[s._id]                        = s.photo || null;
        if (s.name)       studentPhotoMap[s.name.toLowerCase()]          = s.photo || null;
        if (s.enrollmentNo) studentPhotoMap[s.enrollmentNo.toLowerCase()] = s.photo || null;
      });

      const cardsWithPhotos = cardArr.map(card => {
        const studentId = card.student ? (card.student._id || card.student) : null;
        let foundPhoto =
          card.photo ||
          (card.student && typeof card.student === 'object' && card.student.photo) ||
          (studentId && studentPhotoMap[studentId]) ||
          (card.studentName && studentPhotoMap[card.studentName.toLowerCase()]) ||
          (card.enrollmentNo && studentPhotoMap[card.enrollmentNo.toLowerCase()]) ||
          null;

        return { ...card, studentPhoto: foundPhoto };
      });

      setCards(cardsWithPhotos);
    } catch (err) {
      console.error('fetch ID cards', err);
      setMsg(err.userMessage || 'Failed to load ID cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Initialize ID Card Generator on mount
  useEffect(() => {
    const initGenerator = async () => {
      if (typeof IDCardGenerator !== 'undefined') {
        try {
          await IDCardGenerator.loadTemplate('/id-card-template.jpeg');
          setTemplateLoaded(true);
        } catch (err) {
          console.error('Failed to load ID card template:', err);
          setTemplateError(err.message);
        }
      }
    };
    initGenerator();
  }, []);

  const handleTemplateDownload = (card) => {
    if (typeof IDCardGenerator !== 'undefined' && templateLoaded) {
      try {
        IDCardGenerator.download({
          studentName: card.studentName,
          sessionFrom: card.sessionFrom || '',
          sessionTo: card.sessionTo || '',
          fatherName: card.fatherName,
          motherName: card.motherName,
          enrollmentNo: card.enrollmentNo,
          dateOfBirth: card.dateOfBirth,
          contactNo: card.contactNo || '',
          address: card.address || '',
          mobileNo: card.mobileNo || '',
          centerMobileNo: card.centerMobileNo || '',
          photo: card.studentPhoto || card.photo || null,
        });
      } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Failed to generate PDF: ' + err.message);
      }
    } else {
      alert('ID card template not loaded. Please refresh the page.');
    }
  };

  const filteredCards = useMemo(() => {
    if (!search.trim()) return cards;
    const s = search.trim().toLowerCase();
    return cards.filter((c) =>
      (c.studentName || '').toLowerCase().includes(s) ||
      (c.enrollmentNo || '').toLowerCase().includes(s) ||
      (c.courseName || '').toLowerCase().includes(s)
    );
  }, [cards, search]);

  const handleView = (card) => {
    setViewingCard(card);
    setShowViewModal(true);
  };

  const handleEdit = (card) => {
    setEditing(card);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ID card?')) return;
    try {
      await API.delete(`/id-cards/${id}`);
      setCards((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setMsg('ID card deleted.');
    } catch (err) {
      console.error('delete ID card error:', err);
      setMsg(err.userMessage || 'Failed to delete ID card');
    }
  };

  const handleSaved = (saved) => {
    setCards((prev) => {
      const idx = prev.findIndex((c) => (c._id || c.id) === (saved._id || saved.id));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    setShowModal(false);
    setEditing(null);
    setMsg(saved ? 'ID card saved.' : '');
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>ID Cards</h2>
        <button
          className="btn btn-primary"
          onClick={() => { setEditing(null); setShowModal(true); }}
        >
          + Create ID Card
        </button>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name, enrollment no, course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">Loading...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Student Name</th>
                <th>Father Name</th>
                <th>Enrollment No</th>
                <th>Date of Birth</th>
                <th>Mobile No</th>
                <th>Course</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No ID cards found
                  </td>
                </tr>
              ) : (
                filteredCards.map((c) => (
                  <tr key={c._id || c.id}>
                    <td>{c.studentName}</td>
                    <td>{c.fatherName}</td>
                    <td>{c.enrollmentNo}</td>
                    <td>{fmtDate(c.dateOfBirth)}</td>
                    <td>{c.mobileNo}</td>
                    <td>{c.courseName}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-info me-1"
                        onClick={() => handleView(c)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success me-1"
                        onClick={() => handleTemplateDownload(c)}
                        title="Download/Print ID Card"
                      >
                        Download
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(c._id || c.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <IDCardModal
        show={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSaved={handleSaved}
        initial={editing}
      />

      <IDCardViewModal
        show={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingCard(null); }}
        card={viewingCard}
      />

      {/* Hidden canvas for template-based ID card generation */}
      <canvas id="idCardCanvas" style={{ display: 'none' }}></canvas>
    </div>
  );
}

export default IDCardList;