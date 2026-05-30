// src/pages/AddResults.jsx
import { useEffect, useState, useMemo } from "react";
import API from "../api/axiosInstance";

export default function AddResults() {
  // Data lists
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  // Loading states
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form selections
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  // Subject marks - keyed by subjectId
  const [subjectMarks, setSubjectMarks] = useState({});

  // Messages
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // Exam info
  const [examSession, setExamSession] = useState("");
  const [examDate, setExamDate] = useState("");
  const [remarks, setRemarks] = useState("");

  /* ================= FETCH STUDENTS ================= */
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await API.get("/students");
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStudents(list);
      } catch (err) {
        console.error("fetch students error:", err);
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/login";
          return;
        }
        setMessageType("danger");
        setMessage("Failed to load students list");
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  /* ================= FETCH COURSES ================= */
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await API.get("/courses");
        const list =
          Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
        setCourses(list);
      } catch (err) {
        console.error("fetch courses error:", err);
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/login";
          return;
        }
        setMessageType("danger");
        setMessage("Failed to load courses list");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  /* ================= FETCH ALL SUBJECTS ONCE ================= */
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await API.get("/subjects");
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setAllSubjects(list);
      } catch (err) {
        console.error("fetch subjects error:", err);
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/login";
          return;
        }
        setMessageType("danger");
        setMessage("Failed to load subjects");
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  /* ================= FILTER SUBJECTS BY COURSE (CLIENT-SIDE) ================= */
  const getSubjectCourseId = (s) =>
    s.course && typeof s.course === "object"
      ? String(s.course._id)
      : String(s.course || s.courseId || "");

  const subjects = useMemo(() => {
    if (!selectedCourse) return [];
    return allSubjects.filter(
      (s) => getSubjectCourseId(s) === selectedCourse
    );
  }, [allSubjects, selectedCourse]);

  /* ================= INITIALIZE MARKS WHEN SUBJECTS CHANGE ================= */
  useEffect(() => {
    const initialMarks = {};
    subjects.forEach((sub) => {
      initialMarks[sub._id] = {
        marksObtained: "",
        practicalMarks: ""
      };
    });
    setSubjectMarks(initialMarks);
  }, [subjects]);

  /* ================= GET SELECTED STUDENT INFO ================= */
  const getSelectedStudentInfo = () => {
    return students.find((s) => s._id === selectedStudent);
  };

  /* ================= HANDLE MARKS CHANGE ================= */
  const handleMarksChange = (subjectId, field, value) => {
    setSubjectMarks((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!selectedStudent) {
      setMessageType("danger");
      setMessage("Please select a student.");
      return false;
    }

    if (!selectedCourse) {
      setMessageType("danger");
      setMessage("Please select a course.");
      return false;
    }

    if (subjects.length === 0) {
      setMessageType("danger");
      setMessage("No subjects found for this course.");
      return false;
    }

    // Check if at least one subject has marks entered
    const hasMarks = subjects.some((sub) => {
      const marks = subjectMarks[sub._id];
      return marks && (marks.marksObtained !== "" || marks.practicalMarks !== "");
    });

    if (!hasMarks) {
      setMessageType("danger");
      setMessage("Please enter marks for at least one subject.");
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validate()) return;

    setSaving(true);
    try {
      const studentInfo = getSelectedStudentInfo();

      // Build subjects array with marks
      const subjectsPayload = subjects
        .filter((sub) => {
          const marks = subjectMarks[sub._id];
          return marks && (marks.marksObtained !== "" || marks.practicalMarks !== "");
        })
        .map((sub) => ({
          subjectId: sub._id,
          marksObtained: Number(subjectMarks[sub._id]?.marksObtained) || 0,
          practicalMarks: Number(subjectMarks[sub._id]?.practicalMarks) || 0
        }));

      const payload = {
        studentId: selectedStudent,
        rollNumber: studentInfo?.rollNumber || "",
        courseId: selectedCourse,
        subjects: subjectsPayload,
        examSession,
        examDate,
        remarks
      };

      await API.post("/results", payload);

      setMessageType("success");
      setMessage("Result added successfully!");

      // Reset form
      setSelectedStudent("");
      setSelectedCourse("");
      setSubjectMarks({});
      setExamSession("");
      setExamDate("");
      setRemarks("");
    } catch (err) {
      console.error("add result error:", err);
      if (err?.response?.status === 401) {
        // Token expired or invalid, clear storage and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        window.location.href = "/login";
        return;
      }
      setMessageType("danger");
      setMessage(err.response?.data?.message || err.userMessage || "Failed to add result");
    } finally {
      setSaving(false);
    }
  };

  /* ================= CALCULATE TOTALS ================= */
  const calculateTotals = () => {
    let totalMax = 0;
    let totalObtained = 0;

    subjects.forEach((sub) => {
      const maxMarks = sub.maxMarks || 100;
      const maxPractical = sub.practicalMarks || 0;
      totalMax += maxMarks + maxPractical;

      const marks = subjectMarks[sub._id];
      if (marks) {
        totalObtained += (Number(marks.marksObtained) || 0) + (Number(marks.practicalMarks) || 0);
      }
    });

    const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;

    return { totalMax, totalObtained, percentage };
  };

  const totals = calculateTotals();

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-4 fw-bold">Create Result</h2>

          {message && (
            <div className={`alert alert-${messageType}`} role="alert">
              {message}
            </div>
          )}

          <div className="row">
            {/* Main Form */}
            <div className="col-lg-8">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Student & Course Selection</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Student Selection */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Select Student <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        disabled={loadingStudents}
                        required
                      >
                        <option value="">
                          {loadingStudents ? "Loading students..." : "Select a student"}
                        </option>
                        {students.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.rollNumber}) - {s.courseName || "No Course"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Course Selection */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Select Course <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        disabled={loadingCourses}
                        required
                      >
                        <option value="">
                          {loadingCourses ? "Loading courses..." : "Select a course"}
                        </option>
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title || c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Exam Info */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Exam Session</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., 2024-25"
                          value={examSession}
                          onChange={(e) => setExamSession(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Exam Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Subject Marks Table - Auto-displayed when course is selected */}
                    {selectedCourse && (
                      <div className="border-top pt-4 mt-4">
                        <h5 className="mb-3">
                          Subject Marks
                          {loadingSubjects && (
                            <span className="badge bg-secondary ms-2">Loading...</span>
                          )}
                        </h5>

                        {subjects.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead className="table-light">
                                <tr>
                                  <th style={{ width: "40%" }}>Subject</th>
                                  <th className="text-center" style={{ width: "15%" }}>Max Marks</th>
                                  <th className="text-center" style={{ width: "15%" }}>Obtained</th>
                                  <th className="text-center" style={{ width: "15%" }}>Practical</th>
                                  <th className="text-center" style={{ width: "15%" }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subjects.map((sub) => {
                                  const marks = subjectMarks[sub._id] || {};
                                  const obtained = Number(marks.marksObtained) || 0;
                                  const practical = Number(marks.practicalMarks) || 0;
                                  const total = obtained + practical;

                                  return (
                                    <tr key={sub._id}>
                                      <td>
                                        <strong>{sub.name}</strong>
                                      </td>
                                      <td className="text-center">{sub.maxMarks || 100}</td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control text-center"
                                          placeholder="0"
                                          value={marks.marksObtained || ""}
                                          onChange={(e) =>
                                            handleMarksChange(sub._id, "marksObtained", e.target.value)
                                          }
                                          min="0"
                                          max={sub.maxMarks || 100}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control text-center"
                                          placeholder="0"
                                          value={marks.practicalMarks || ""}
                                          onChange={(e) =>
                                            handleMarksChange(sub._id, "practicalMarks", e.target.value)
                                          }
                                          min="0"
                                        />
                                      </td>
                                      <td className="text-center">
                                        <strong>{total}</strong>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="table-secondary">
                                <tr>
                                  <th colSpan="2" className="text-end">Total:</th>
                                  <th className="text-center">{totals.totalMax}</th>
                                  <th></th>
                                  <th className="text-center">{totals.totalObtained}</th>
                                </tr>
                                <tr>
                                  <th colSpan="3" className="text-end">Percentage:</th>
                                  <th colSpan="2" className="text-center">
                                    <span className={totals.percentage >= 40 ? "text-success" : "text-danger"}>
                                      {totals.percentage}%
                                    </span>
                                  </th>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : (
                          !loadingSubjects && (
                            <div className="alert alert-warning">
                              No subjects found for this course. Please add subjects to this course first.
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Remarks */}
                    <div className="mb-3 mt-4">
                      <label className="form-label">Remarks</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Any additional remarks..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2"
                      disabled={saving || subjects.length === 0}
                    >
                      {saving ? "Saving..." : "Save Result"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Sidebar - Selected Student Info */}
            <div className="col-lg-4">
              {selectedStudent && (
                <div className="card shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Student Details</h5>
                  </div>
                  <div className="card-body">
                    {(() => {
                      const student = getSelectedStudentInfo();
                      if (!student) return null;
                      return (
                        <>
                          {student.photo && (
                            <div className="text-center mb-3">
                              <img
                                src={student.photo}
                                alt={student.name}
                                className="rounded-circle"
                                style={{
                                  width: "80px",
                                  height: "80px",
                                  objectFit: "cover"
                                }}
                              />
                            </div>
                          )}
                          <p>
                            <strong>Name:</strong> {student.name}
                          </p>
                          <p>
                            <strong>Roll No:</strong> {student.rollNumber}
                          </p>
                          <p>
                            <strong>Course:</strong> {student.courseName || "N/A"}
                          </p>
                          {student.fatherName && (
                            <p>
                              <strong>Father's Name:</strong> {student.fatherName}
                            </p>
                          )}
                          {student.centerName && (
                            <p>
                              <strong>Center:</strong> {student.centerName}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Summary Card */}
              {selectedCourse && subjects.length > 0 && (
                <div className="card shadow-sm mt-3">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">Result Summary</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Subjects:</span>
                      <strong>{subjects.length}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Marks:</span>
                      <strong>{totals.totalObtained} / {totals.totalMax}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Percentage:</span>
                      <strong className="text-success">{totals.percentage}%</strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span>Status:</span>
                      <strong
                        className={
                          totals.percentage >= 40 ? "text-success" : "text-danger"
                        }
                      >
                        {totals.percentage >= 40 ? "PASS" : "FAIL"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
