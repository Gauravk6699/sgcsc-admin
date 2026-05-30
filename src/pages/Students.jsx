// src/pages/Students.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import StudentTable from "../components/StudentTable";
import EditStudentModal from "../components/EditStudentModal";

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("all");
  const [viewMode, setViewMode] = useState("all");

  // edit modal state
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // view details modal state
  const [viewing, setViewing] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Initialise view mode from query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    setViewMode(view === "franchise" ? "franchise" : "all");
  }, [location.search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/students");
      const data = res.data;
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];
      setStudents(arr);
    } catch (err) {
      console.error("fetchStudents:", err);
      setError(err.userMessage || "Failed to fetch students");
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStudents();
    // Fetch courses for dropdown
    const fetchCourses = async () => {
      try {
        const res = await API.get("/courses");
        const data = res.data;
        setCourses(Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error("fetchCourses error:", err);
      }
    };
    fetchCourses();
  }, [fetchStudents]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await API.delete(`/students/${id}`);
      setStudents((prev) => prev.filter((s) => (s._id || s.id) !== id));
    } catch (err) {
      console.error("delete student:", err);
      setError(err.userMessage || "Failed to delete student");
    }
  };

  const handleOpenEdit = (student) => {
    setEditing(student);
    setEditError("");
  };

  const handleOpenView = (student) => {
    setViewing(student);
  };

  const closeView = () => {
    setViewing(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditError("");
    setSavingEdit(false);
  };

  const handleSaveEdit = async (editForm) => {
    if (!editing) return;
    const id = editing._id || editing.id;
    if (!id) return;

    setSavingEdit(true);
    setEditError("");

    try {
      const payload = {
        centerName: editForm.centerName,
        name: editForm.name,
        fatherName: editForm.fatherName,
        motherName: editForm.motherName,
        rollNumber: editForm.rollNumber,
        gender: editForm.gender,
        dob: editForm.dob || null,
        email: editForm.email,
        mobile: editForm.mobile,
        state: editForm.state,
        district: editForm.district,
        address: editForm.address,
        examPassed: editForm.examPassed,
        marksOrGrade: editForm.marksOrGrade,
        board: editForm.board,
        passingYear: editForm.passingYear,
        username: editForm.username,
        ...(editForm.password && { password: editForm.password }),
        courses: editForm.courses
          ? editForm.courses.map((c) => ({
              course: c.courseId || null,
              courseName: c.courseName,
              feeAmount: Number(c.feeAmount) || 0,
              amountPaid: Number(c.amountPaid) || 0,
              feesPaid: c.feesPaid || false,
              sessionStart: c.sessionStart || null,
              sessionEnd: c.sessionEnd || null,
            }))
          : [],
      };

      const res = await API.put(`/students/${id}`, payload);
      const updated = res.data;
      const updatedStudent =
        updated && updated.data && updated.success ? updated.data : updated;

      setStudents((prev) =>
        prev.map((s) =>
          (s._id || s.id) === (updatedStudent._id || updatedStudent.id)
            ? { ...s, ...updatedStudent }
            : s
        )
      );

      closeEdit();
    } catch (err) {
      console.error("update student error:", err);
      setEditError(err.userMessage || "Failed to update student");
    } finally {
      setSavingEdit(false);
    }
  };

  const centers = useMemo(() => {
    const set = new Set();
    (students || []).forEach((s) => {
      const name =
        s.centerName || s.franchiseName || s.instituteName || s.center || "";
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = students || [];

    if (selectedCenter !== "all") {
      list = list.filter((s) => {
        const name =
          s.centerName || s.franchiseName || s.instituteName || s.center || "";
        return name === selectedCenter;
      });
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter((s) => {
        const fields = [
          s.name,
          s.studentName,
          s.centerName,
          s.franchiseName,
          s.instituteName,
          s.email,
          s.mobile,
          s.state,
          s.district,
          s.examPassed,
          s.board,
          s.username,
          s.courseName,
        ];
        return fields.some(
          (v) => typeof v === "string" && v.toLowerCase().includes(term)
        );
      });
    }

    return list;
  }, [students, search, selectedCenter]);

  const groupedByCenter = useMemo(() => {
    const groups = {};
    filteredStudents.forEach((s) => {
      const key =
        s.centerName || s.franchiseName || s.instituteName || s.center || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [filteredStudents]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Students</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/students/add")}
        >
          + Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3 align-items-end">
          <div style={{ minWidth: 240 }}>
            <label className="form-label">Search</label>
            <input
              className="form-control"
              placeholder="Name, email, mobile, course…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 200 }}>
            <label className="form-label">Center</label>
            <select
              className="form-select"
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
            >
              <option value="all">All Centers</option>
              {centers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="ms-auto small text-muted">
            Showing <strong>{filteredStudents.length}</strong> of{" "}
            <strong>{students.length}</strong> students
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* MAIN CONTENT */}
      {loading ? (
        <div className="card">
          <div className="card-body text-center">Loading students…</div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted">
            No students found. Try changing filters or add a new student.
          </div>
        </div>
      ) : viewMode === "all" ? (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <StudentTable
              students={filteredStudents}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onView={handleOpenView}
            />
          </div>
        </div>
      ) : (
        <div className="accordion" id="studentsByCenterAccordion">
          {Object.entries(groupedByCenter).map(([centerName, list], idx) => (
            <div className="accordion-item mb-2" key={centerName}>
              <h2 className="accordion-header">
                <button
                  className={
                    "accordion-button " + (idx === 0 ? "" : "collapsed")
                  }
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#center-${idx}`}
                  aria-expanded={idx === 0 ? "true" : "false"}
                >
                  <div className="d-flex flex-column">
                    <span className="fw-semibold">{centerName}</span>
                    <span className="small text-muted">
                      {list.length} student{list.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              </h2>
              <div
                id={`center-${idx}`}
                className={
                  "accordion-collapse collapse " + (idx === 0 ? "show" : "")
                }
                data-bs-parent="#studentsByCenterAccordion"
              >
                <div className="accordion-body p-0">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Student</th>
                          <th>Mobile</th>
                          <th>Course</th>
                          <th>Session</th>
                          <th>Exam / Board</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((s) => {
                          const id = s._id || s.id;
                          const name = s.name || s.studentName || "-";
                          // Get course name from courses array or legacy fields
                          const course =
                            (Array.isArray(s.courses) && s.courses.length > 0)
                              ? (s.courses[0].courseName || s.courses[0].name || "-") +
                                (s.courses.length > 1 ? ` (+${s.courses.length - 1} more)` : "")
                              : s.courseName ||
                                s.course?.title ||
                                s.course?.name ||
                                "-";
                          const session =
                            (s.sessionStart || s.sessionEnd) &&
                            `${fmtDate(s.sessionStart)} – ${fmtDate(
                              s.sessionEnd
                            )}`;
                          return (
                            <tr key={id}>
                              <td>
                                <div className="fw-semibold">{name}</div>
                                <div className="small text-muted">
                                  {s.email || ""}
                                </div>
                              </td>
                              <td>{s.mobile || "-"}</td>
                              <td>{course}</td>
                              <td className="small text-muted">
                                {session || "-"}
                              </td>
                              <td className="small text-muted">
                                {s.examPassed || "-"}
                                {s.board ? `, ${s.board}` : ""}
                                {s.marksOrGrade ? ` (${s.marksOrGrade})` : ""}
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-outline-info me-2"
                                  onClick={() => handleOpenView(s)}
                                >
                                  View
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() => handleOpenEdit(s)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete(id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditStudentModal
        student={editing}
        courses={courses}
        onClose={closeEdit}
        onSave={handleSaveEdit}
        saving={savingEdit}
        error={editError}
      />

      {/* View Details Modal - Student Information */}
      {viewing && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Student Details - {viewing.name || viewing.studentName || "Unknown"}
                </h5>
                <button type="button" className="btn-close" onClick={closeView}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Personal Information */}
                  <div className="col-md-6 mb-3">
                    <h6 className="border-bottom pb-2 mb-3">Personal Information</h6>
                    <p className="mb-1"><strong>Name:</strong> {viewing.name || viewing.studentName || "-"}</p>
                    <p className="mb-1"><strong>Father's Name:</strong> {viewing.fatherName || "-"}</p>
                    <p className="mb-1"><strong>Mother's Name:</strong> {viewing.motherName || "-"}</p>
                    <p className="mb-1"><strong>Gender:</strong> {viewing.gender || "-"}</p>
                    <p className="mb-1"><strong>Date of Birth:</strong> {viewing.dob ? new Date(viewing.dob).toLocaleDateString('en-IN') : "-"}</p>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="col-md-6 mb-3">
                    <h6 className="border-bottom pb-2 mb-3">Contact Information</h6>
                    <p className="mb-1"><strong>Email:</strong> {viewing.email || "-"}</p>
                    <p className="mb-1"><strong>Mobile:</strong> {viewing.mobile || viewing.contact || "-"}</p>
                    <p className="mb-1"><strong>State:</strong> {viewing.state || "-"}</p>
                    <p className="mb-1"><strong>District:</strong> {viewing.district || "-"}</p>
                    <p className="mb-1"><strong>Address:</strong> {viewing.address || "-"}</p>
                  </div>

                  {/* Academic Information */}
                  <div className="col-md-6 mb-3">
                    <h6 className="border-bottom pb-2 mb-3">Academic Information</h6>
                    <p className="mb-1"><strong>Roll Number:</strong> {viewing.rollNumber || "-"}</p>
                    <p className="mb-1"><strong>Enrollment No:</strong> {viewing.enrollmentNo || viewing.enrollment || "-"}</p>
                    <p className="mb-1"><strong>Course:</strong> {viewing.courseName || (viewing.course && viewing.course.title) || "-"}</p>
                    <p className="mb-1"><strong>Exam Passed:</strong> {viewing.examPassed || "-"}</p>
                    <p className="mb-1"><strong>Board:</strong> {viewing.board || "-"}</p>
                    <p className="mb-1"><strong>Marks/Grade:</strong> {viewing.marksOrGrade || "-"}</p>
                  </div>

                  {/* Fee Details */}
                  <div className="col-md-6 mb-3">
                    <h6 className="border-bottom pb-2 mb-3">Fee Details</h6>
                    {(() => {
                      const feeDetails = viewing.courses && Array.isArray(viewing.courses) && viewing.courses.length > 0
                        ? {
                            fee: viewing.courses.reduce((sum, c) => sum + (Number(c.feeAmount) || 0), 0),
                            paid: viewing.courses.reduce((sum, c) => sum + (Number(c.amountPaid) || 0), 0),
                          }
                        : { fee: Number(viewing.feeAmount) || 0, paid: Number(viewing.amountPaid) || 0 };
                      const pending = feeDetails.fee - feeDetails.paid;
                      return (
                        <>
                          <p className="mb-1"><strong>Total Fee:</strong> ₹{feeDetails.fee}</p>
                          <p className="mb-1"><strong>Amount Paid:</strong> ₹{feeDetails.paid}</p>
                          <p className="mb-1">
                            <strong>Pending:</strong>{" "}
                            <span className={pending > 0 ? "text-danger" : "text-success"}>
                              ₹{pending}
                            </span>
                          </p>
                          <p className="mb-1"><strong>Fees Paid:</strong> {viewing.feesPaid ? "Yes" : "No"}</p>
                        </>
                      );
                    })()}
                  </div>

                  {/* Center Information */}
                  <div className="col-12 mb-3">
                    <h6 className="border-bottom pb-2 mb-3">Center Information</h6>
                    <p className="mb-1"><strong>Center:</strong> {viewing.centerName || viewing.franchiseName || viewing.instituteName || viewing.center || "-"}</p>
                    <p className="mb-1"><strong>Session:</strong> {viewing.sessionStart && viewing.sessionEnd ? `${new Date(viewing.sessionStart).toLocaleDateString('en-IN')} - ${new Date(viewing.sessionEnd).toLocaleDateString('en-IN')}` : "-"}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeView}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
