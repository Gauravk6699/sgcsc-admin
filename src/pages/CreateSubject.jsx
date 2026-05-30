// src/pages/CreateSubject.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export default function CreateSubject() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const subjectId = params.get("id");

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [minMarks, setMinMarks] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);

  /* ----------------------------------------------------
     Load courses FIRST (dropdown source of truth)
  ---------------------------------------------------- */
  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await API.get("/courses");
        const arr = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setCourses(arr);
      } catch (err) {
        console.error("load courses", err);
        setError("Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  /* ----------------------------------------------------
     Load subject AFTER courses are available
  ---------------------------------------------------- */
  useEffect(() => {
    const loadSubject = async () => {
      if (!subjectId || courses.length === 0) {
        setInitialLoaded(true);
        return;
      }

      try {
        const res = await API.get(`/subjects/${subjectId}`);
        const s = res.data?.data || {};

        const extractedCourseId =
          typeof s.course === "object"
            ? s.course._id || s.course.id
            : s.course || s.courseId || "";

        setCourseId(String(extractedCourseId));
        setName(s.name || s.subjectName || "");
        setMaxMarks(s.maxMarks ?? s.max ?? "");
        setMinMarks(s.minMarks ?? s.min ?? "");
      } catch (err) {
        console.error("load subject", err);
        setError("Failed to load subject");
      } finally {
        setInitialLoaded(true);
      }
    };

    loadSubject();
  }, [subjectId, courses]);

  /* ----------------------------------------------------
     Submit
  ---------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!courseId) {
      setError("Please select a course");
      return;
    }

    if (!name.trim()) {
      setError("Subject name is required");
      return;
    }

    const payload = {
      course: courseId,
      name: name.trim(),
      maxMarks: Number(maxMarks) || 0,
      minMarks: Number(minMarks) || 0,
    };

    setSaving(true);
    try {
      if (subjectId) {
        await API.put(`/subjects/${subjectId}`, payload);
      } else {
        await API.post("/subjects", payload);
      }
      navigate("/subjects");
    } catch (err) {
      console.error("save subject", err);
      setError(
        err?.response?.data?.message || "Failed to save subject"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/subjects");

  if (!initialLoaded && subjectId) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border me-2" />
        Loading subject…
      </div>
    );
  }

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>{subjectId ? "Edit Subject" : "Create Subject"}</h2>
            <button
              className="btn btn-outline-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Back
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form
            onSubmit={handleSubmit}
            className="card shadow-sm p-4"
            style={{ maxWidth: 700 }}
          >
            <div className="mb-3">
              <label className="form-label">
                Course <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                disabled={loadingCourses}
                required
              >
                <option value="">
                  {loadingCourses ? "Loading courses…" : "Select course"}
                </option>
                {courses.map((c) => (
                  <option key={c._id} value={String(c._id)}>
                    {c.title || c.name || "Untitled course"}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">
                Subject Name <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Maximum Marks</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Minimum Marks</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={minMarks}
                  onChange={(e) => setMinMarks(e.target.value)}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary me-2"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : subjectId
                  ? "Save Changes"
                  : "Create Subject"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
