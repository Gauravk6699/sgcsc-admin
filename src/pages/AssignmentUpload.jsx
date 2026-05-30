// src/pages/AssignmentUpload.jsx
import { useState } from "react";
import API from "../api/axiosInstance";

export default function AssignmentUpload() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");

  const validate = () => {
    if (!file) {
      setMsgType("danger");
      setMsg("File is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!validate()) return;

    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", file); // MUST match multer.single('file')
      if (description.trim()) {
        form.append("description", description.trim());
      }

      await API.post("/assignments", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsgType("success");
      setMsg("Assignment uploaded successfully");

      setFile(null);
      setDescription("");
      e.target.reset();
    } catch (err) {
      console.error("upload assignment error", err);
      setMsgType("danger");
      setMsg(err.userMessage || "Failed to upload assignment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2>Upload Assignment</h2>
      <p className="text-muted">
        Upload Word, PDF, or PowerPoint files with an optional description.
      </p>

      {msg && (
        <div
          className={`alert alert-${
            msgType === "danger"
              ? "danger"
              : msgType === "success"
              ? "success"
              : "info"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">File *</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description (optional)</label>
              <textarea
                className="form-control"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description about this assignment"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Uploading…" : "Upload Assignment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
