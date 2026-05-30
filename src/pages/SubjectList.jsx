// src/pages/SubjectList.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export default function SubjectList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ----------------------------------------------------
     Helpers
  ---------------------------------------------------- */
  const normalizeCourse = (c) => ({
    id: String(c._id),
    name: c.title || c.name || "Untitled course",
  });

  const getSubjectCourseId = (s) => {
    if (!s.course) return "";
    return typeof s.course === "object"
      ? String(s.course._id || "")
      : String(s.course || s.courseId || "");
  };

  /* ----------------------------------------------------
     Load data
  ---------------------------------------------------- */
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [courseRes, subjectRes] = await Promise.all([
        API.get("/courses"),
        API.get("/subjects"),
      ]);

      setCourses(courseRes.data?.data || []);
      setSubjects(subjectRes.data?.data || []);
    } catch (err) {
      console.error("load subjects/courses", err);
      setError("Failed to load subjects or courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach((c) => {
      const n = normalizeCourse(c);
      map[n.id] = n.name;
    });
    return map;
  }, [courses]);

  const filteredSubjects = useMemo(() => {
    if (selectedCourse === "all") return subjects;
    return subjects.filter(
      (s) => getSubjectCourseId(s) === selectedCourse
    );
  }, [subjects, selectedCourse]);

  /* ----------------------------------------------------
     Actions
  ---------------------------------------------------- */
  const handleEdit = (s) =>
    navigate(`/subjects/create?id=${s._id}`);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await API.delete(`/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("Failed to delete subject");
    }
  };

  /* ----------------------------------------------------
     Render
  ---------------------------------------------------- */
  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Subjects</h2>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={loadData}
                disabled={loading}
              >
                Refresh
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/subjects/create")}
              >
                Add Subject
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="mb-3 col-md-4">
                <select
                  className="form-select"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => {
                    const n = normalizeCourse(c);
                    return (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {loading ? (
                <div className="text-center py-4">Loading…</div>
              ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No subjects found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-primary">
                      <tr>
                        <th>Course</th>
                        <th>Subject</th>
                        <th className="text-center">Max</th>
                        <th className="text-center">Min</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubjects.map((s) => (
                        <tr key={s._id}>
                          <td>
                            {courseMap[getSubjectCourseId(s)] || "-"}
                          </td>
                          <td>{s.name}</td>
                          <td className="text-center">
                            {s.maxMarks ?? 0}
                          </td>
                          <td className="text-center">
                            {s.minMarks ?? 0}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleEdit(s)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(s._id)}
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
    </div>
  );
}
