// src/components/EditStudentModal.jsx
import { useState, useEffect } from "react";

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

export default function EditStudentModal({
  student,
  courses,
  onClose,
  onSave,
  saving,
  error,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    courses: [],
  });

  useEffect(() => {
    if (!student) return;

    const s = student;

    // Initialize courses array from student data
    let studentCourses = [];
    if (s.courses && Array.isArray(s.courses) && s.courses.length > 0) {
      studentCourses = s.courses.map((c) => ({
        courseId: c.course?._id || c.course || c.courseId || "",
        courseName: c.courseName || "",
        feeAmount: c.feeAmount || 0,
        amountPaid: c.amountPaid || 0,
        feesPaid: c.feesPaid || false,
        sessionStart: fmtDate(c.sessionStart),
        sessionEnd: fmtDate(c.sessionEnd),
      }));
    } else if (s.course) {
      // Convert single course to array for backwards compatibility
      studentCourses = [
        {
          courseId: s.course?._id || s.course || "",
          courseName: s.courseName || "",
          feeAmount: s.feeAmount || 0,
          amountPaid: s.amountPaid || 0,
          feesPaid: s.feesPaid || false,
          sessionStart: fmtDate(s.sessionStart),
          sessionEnd: fmtDate(s.sessionEnd),
        },
      ];
    } else {
      // Start with one empty course entry
      studentCourses = [
        {
          courseId: "",
          courseName: "",
          feeAmount: 0,
          amountPaid: 0,
          feesPaid: false,
          sessionStart: "",
          sessionEnd: "",
        },
      ];
    }

    setEditForm({
      rollNumber: s.rollNumber || "",
      centerName: s.centerName || "",
      name: s.name || "",
      fatherName: s.fatherName || "",
      motherName: s.motherName || "",
      gender: s.gender || "",
      dob: fmtDate(s.dob),
      email: s.email || "",
      mobile: s.mobile || s.contact || "",
      state: s.state || "",
      district: s.district || "",
      address: s.address || "",
      examPassed: s.examPassed || "",
      marksOrGrade: s.marksOrGrade || "",
      board: s.board || "",
      passingYear: s.passingYear || "",
      username: s.username || "",
      password: "",
      courses: studentCourses,
    });
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCourse = () => {
    const newCourse = {
      courseId: "",
      courseName: "",
      feeAmount: 0,
      amountPaid: 0,
      feesPaid: false,
      sessionStart: "",
      sessionEnd: "",
    };
    setEditForm((prev) => ({
      ...prev,
      courses: [...(prev.courses || []), newCourse],
    }));
  };

  const handleRemoveCourse = (index) => {
    setEditForm((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index),
    }));
  };

  const handleCourseArrayChange = (index, field, value) => {
    setEditForm((prev) => {
      const updatedCourses = [...(prev.courses || [])];

      if (field === "courseId") {
        const selected = courses.find(
          (c) => (c._id || c.id || "").toString() === value
        );
        // Try multiple possible fee field names from the course object
        const selectedFee = selected
          ? (selected.feeAmount ?? selected.fee ?? selected.price ?? selected.amount ?? 0)
          : updatedCourses[index]?.feeAmount ?? 0;
        updatedCourses[index] = {
          ...updatedCourses[index],
          courseId: value,
          courseName: selected ? selected.name || selected.title || "" : "",
          feeAmount: selectedFee,
        };
      } else if (field === "amountPaid") {
        // Allow empty string for better UX, convert to number on save
        updatedCourses[index] = {
          ...updatedCourses[index],
          amountPaid: value === "" ? "" : Number(value),
        };
      } else if (field === "feeAmount") {
        // Allow empty string for better UX
        updatedCourses[index] = {
          ...updatedCourses[index],
          feeAmount: value === "" ? "" : Number(value),
        };
      } else if (field === "feesPaid") {
        updatedCourses[index] = {
          ...updatedCourses[index],
          feesPaid: value,
        };
      } else {
        updatedCourses[index] = {
          ...updatedCourses[index],
          [field]: value,
        };
      }

      return { ...prev, courses: updatedCourses };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editForm);
  };

  if (!student) return null;

  return (
    <div className="modal d-block" tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Edit Student</h5>
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

              {/* Basic Info */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label">Roll Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="rollNumber"
                    value={editForm.rollNumber || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Center Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="centerName"
                    value={editForm.centerName || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Student Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={editForm.name || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Parents */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Father's Name</label>
                  <input
                    className="form-control"
                    name="fatherName"
                    value={editForm.fatherName}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mother's Name</label>
                  <input
                    className="form-control"
                    name="motherName"
                    value={editForm.motherName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Gender / DOB */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    name="gender"
                    value={editForm.gender || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dob"
                    value={editForm.dob || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={editForm.email || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mobile</label>
                  <input
                    type="text"
                    className="form-control"
                    name="mobile"
                    value={editForm.mobile || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    name="state"
                    value={editForm.state || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">District</label>
                  <input
                    type="text"
                    className="form-control"
                    name="district"
                    value={editForm.district || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Full Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={editForm.address || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Exam info */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label">Exam Passed</label>
                  <input
                    type="text"
                    className="form-control"
                    name="examPassed"
                    value={editForm.examPassed || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Board</label>
                  <input
                    type="text"
                    className="form-control"
                    name="board"
                    value={editForm.board || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Marks / Grade</label>
                  <input
                    type="text"
                    className="form-control"
                    name="marksOrGrade"
                    value={editForm.marksOrGrade || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Multiple Courses Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Courses</h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={handleAddCourse}
                  >
                    + Add Course
                  </button>
                </div>

                {editForm.courses &&
                  editForm.courses.map((course, index) => (
                    <div key={index} className="card mb-3">
                      <div className="card-body">
                        <div className="row g-2">
                          <div className="col-md-4">
                            <label className="form-label small">
                              Course {index + 1}
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={course.courseId || ""}
                              onChange={(e) =>
                                handleCourseArrayChange(
                                  index,
                                  "courseId",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select Course</option>
                              {courses.map((c) => (
                                <option key={c._id || c.id} value={c._id || c.id}>
                                  {c.title || c.name || "Untitled"}{" "}
                                  {c.feeAmount > 0 ? `(₹${c.feeAmount})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label small">Fee (₹)</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={course.feeAmount ?? ""}
                              onChange={(e) =>
                                handleCourseArrayChange(
                                  index,
                                  "feeAmount",
                                  e.target.value
                                )
                              }
                              min="0"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label small">Paid (₹)</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={course.amountPaid ?? ""}
                              onChange={(e) =>
                                handleCourseArrayChange(
                                  index,
                                  "amountPaid",
                                  e.target.value
                                )
                              }
                              min="0"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label small">Paid?</label>
                            <div className="form-check mt-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={course.feesPaid || false}
                                onChange={(e) =>
                                  handleCourseArrayChange(
                                    index,
                                    "feesPaid",
                                    e.target.checked
                                  )
                                }
                              />
                              <label className="form-check-label small">
                                Yes
                              </label>
                            </div>
                          </div>
                          <div className="col-md-2 d-flex align-items-end">
                            {editForm.courses.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveCourse(index)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="row g-2 mt-2">
                          <div className="col-md-4">
                            <label className="form-label small">
                              Session Start
                            </label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={course.sessionStart || ""}
                              onChange={(e) =>
                                handleCourseArrayChange(
                                  index,
                                  "sessionStart",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small">
                              Session End
                            </label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={course.sessionEnd || ""}
                              onChange={(e) =>
                                handleCourseArrayChange(
                                  index,
                                  "sessionEnd",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-md-4 d-flex align-items-end">
                            <span className="badge bg-warning text-dark">
                              Pending: ₹
                              {(course.feeAmount || 0) -
                                (course.amountPaid || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Username / Password */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Username</label>
                  <input
                    className="form-control"
                    name="username"
                    value={editForm.username}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      name="password"
                      value={editForm.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep unchanged"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword((v) => !v)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i
                        className={`bi ${
                          showPassword ? "bi-eye-slash" : "bi-eye"
                        }`}
                      />
                    </button>
                  </div>
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
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
