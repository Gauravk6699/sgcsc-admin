import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axiosInstance";

export default function AddMember() {
  const navigate = useNavigate();
  const location = useLocation();

  const editingMember = location.state?.member || null;
  const isEditMode = Boolean(editingMember);

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [photo, setPhoto] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ✅ PREFILL FORM FOR EDIT
  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name || "");
      setDesignation(editingMember.designation || "");
      setIsActive(editingMember.isActive);
    }
  }, [editingMember]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("designation", designation.trim());
    fd.append("isActive", isActive ? "true" : "false");

    if (photo) fd.append("photo", photo);

    try {
      if (isEditMode) {
        // 🔁 UPDATE
        await API.put(`/members/${editingMember._id}`, fd);
      } else {
        // ➕ CREATE
        await API.post("/members", fd);
      }
      navigate("/members");
    } catch (err) {
      console.error("save member error:", err);
      setError(
        err?.response?.data?.message || "Failed to save member"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-4">
        {isEditMode ? "Edit Member" : "Add Institute Member"}
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">

            <div className="col-md-6">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Designation</label>
              <input
                type="text"
                className="form-control"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                {isEditMode ? "Change Photo" : "Member Photo"}
              </label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
              />
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label className="form-check-label">
                  Show on site
                </label>
              </div>
            </div>

            <div className="col-12">
              <button className="btn btn-primary" disabled={saving}>
                {saving
                  ? "Saving..."
                  : isEditMode
                  ? "Save Changes"
                  : "Save Member"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary ms-2"
                onClick={() => navigate("/members")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
