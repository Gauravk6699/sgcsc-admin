import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axiosInstance"; // ✅ ADMIN axios (IMPORTANT)

export default function CreateCourse() {
  const navigate = useNavigate();
  const location = useLocation();

  // detect edit mode
  const params = new URLSearchParams(location.search);
  const courseId = params.get("id");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [type, setType] = useState("long");
  const [feeAmount, setFeeAmount] = useState(0);

  /* ======================================================
     LOAD COURSE (EDIT MODE)
     ====================================================== */
  useEffect(() => {
    if (!courseId) return;

    const loadCourse = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await API.get(`/courses/${courseId}`);
        const data = res?.data?.data ?? res?.data;

        if (!data) throw new Error("Invalid course data");

        setTitle(data.title || "");
        setDescription(data.description || "");
        setDuration(data.duration || "");
        setType(data.type || "long");
        setFeeAmount(data.feeAmount || 0);
      } catch (err) {
        console.error("Load course error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load course"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  /* ======================================================
     SUBMIT (CREATE / UPDATE)
     ====================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Course name is required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        duration: duration.trim(),
        type,
        feeAmount: Number(feeAmount) || 0,
      };

      if (courseId) {
        // EDIT
        await API.put(`/courses/${courseId}`, payload);
      } else {
        // CREATE
        await API.post("/courses", payload);
      }

      navigate("/courses");
    } catch (err) {
      console.error("Save course error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save course"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ======================================================
     UI
     ====================================================== */

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary me-2" />
        Loading course…
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            {courseId ? "Edit Course" : "Create Course"}
          </h2>
          {/* <div className="text-muted">
            Manage course name, duration and type
          </div> */}
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/courses")}
          disabled={saving}
        >
          Back to Courses
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="card shadow-sm border-0 p-4"
      >
        {/* Course Name */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Course Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Diploma in Computer Application"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Description</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Type + Duration */}
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Course Type</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="long">Long Term</option>
              <option value="short">Short Term</option>
              <option value="certificate">Certificate</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Duration</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 1 Year / 6 Months"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Fee Amount (₹)</label>
            <input
              type="number"
              className="form-control"
              placeholder="Course fee"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-end mt-4">
          <button
            type="button"
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate("/courses")}
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
              ? courseId
                ? "Saving…"
                : "Creating…"
              : courseId
              ? "Save Changes"
              : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
