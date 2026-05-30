// src/pages/IDCardCreate.jsx
import { useEffect, useState } from 'react';
import API from "../api/axiosInstance";

export default function IDCardCreate() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Form fields
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
        console.error('load students/courses error (id card):', err);
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
    if (!enrollmentNo.trim()) {
      setMessageType('danger');
      setMessage('Enrollment Number is required.');
      return false;
    }
    if (!dateOfBirth) {
      setMessageType('danger');
      setMessage('Date of Birth is required.');
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
        courseId: courseId || undefined,
        studentId: studentId || undefined,
      };

      await API.unwrap(API.post('/id-cards', payload));

      setMessageType('success');
      setMessage('ID Card created successfully.');

      // Reset form
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
      setCourseId('');
      setStudentId('');
    } catch (err) {
      console.error('create ID card error:', err);
      setMessageType('danger');
      setMessage(err.userMessage || 'Failed to create ID card');
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
        setStudentName(selectedStudent.name || '');
        setFatherName(selectedStudent.fatherName || '');
        setMotherName(selectedStudent.motherName || '');
        setEnrollmentNo(selectedStudent.enrollmentNo || selectedStudent.rollNumber || '');
        setDateOfBirth(selectedStudent.dob ? new Date(selectedStudent.dob).toISOString().slice(0, 10) : '');
        setContactNo(selectedStudent.mobile || '');
        setAddress(selectedStudent.address || '');
        setMobileNo(selectedStudent.mobile || '');
        setCenterName(selectedStudent.centerName || '');
      }
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-4 fw-bold">Generate ID Card</h2>

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

                  {/* Enrollment Number */}
                  <div className="col-md-6">
                    <label className="form-label">Enrollment Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={enrollmentNo}
                      onChange={(e) => setEnrollmentNo(e.target.value)}
                      placeholder="Enter enrollment number"
                      required
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="col-md-6">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <h5 className="mb-3 text-primary">Contact & Center Details</h5>
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
                    <label className="form-label">Course Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Enter course name"
                    />
                  </div>

                  {/* Center Name */}
                  <div className="col-md-6">
                    <label className="form-label">Center Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      placeholder="Enter center name"
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="col-md-6">
                    <label className="form-label">Contact Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      placeholder="Enter contact number"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="col-md-6">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      placeholder="Enter mobile number"
                    />
                  </div>

                  {/* Center Mobile Number */}
                  <div className="col-md-6">
                    <label className="form-label">Center Mobile Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={centerMobileNo}
                      onChange={(e) => setCenterMobileNo(e.target.value)}
                      placeholder="Enter center mobile number"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-md-6">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter address"
                    />
                  </div>

                  {/* Session From */}
                  <div className="col-md-6">
                    <label className="form-label">Session From</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sessionFrom}
                      onChange={(e) => setSessionFrom(e.target.value)}
                      placeholder="e.g. 2024"
                    />
                  </div>

                  {/* Session To */}
                  <div className="col-md-6">
                    <label className="form-label">Session To</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sessionTo}
                      onChange={(e) => setSessionTo(e.target.value)}
                      placeholder="e.g. 2025"
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={saving || loadingLists}
                    >
                      {saving ? 'Generating ID Card...' : 'Generate ID Card'}
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