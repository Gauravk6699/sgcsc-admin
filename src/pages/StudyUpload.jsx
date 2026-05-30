import { useState } from "react";
import API from "../api/axiosInstance";

const TYPE_OPTIONS = ["pdf", "word", "ppt", "link", "other"];

export default function StudyUpload() {
  // 🔥 REQUIRED FIELD
  const [name, setName] = useState("");

  const [description, setDescription] = useState("");
  const [type, setType] = useState("pdf");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");

  const validate = () => {
    if (!name.trim()) {
      setMsgType("danger");
      setMsg("Name is required.");
      return false;
    }

    if (!file && !linkUrl.trim()) {
      setMsgType("danger");
      setMsg("Either upload a file or provide a link URL.");
      return false;
    }

    if (linkUrl && !/^https?:\/\//i.test(linkUrl.trim())) {
      setMsgType("danger");
      setMsg("Link URL must start with http:// or https://");
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

      // ✅ MUST MATCH BACKEND
      form.append("name", name.trim());
      form.append("description", description.trim());
      form.append("type", type);
      if (linkUrl.trim()) form.append("linkUrl", linkUrl.trim());
      if (file) form.append("file", file);

      await API.post("/study-materials", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsgType("success");
      setMsg("Study material uploaded successfully.");

      setName("");
      setDescription("");
      setType("pdf");
      setLinkUrl("");
      setFile(null);
    } catch (err) {
      setMsgType("danger");
      setMsg(err.userMessage || "Failed to upload study material");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2>Study Material – Upload</h2>

      {msg && <div className={`alert alert-${msgType}`}>{msg}</div>}

      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label className="form-label">Name *</label>
          <input
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HTML Basics"
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Description</label>
          <input
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Type</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-5">
          <label className="form-label">Link URL (optional)</label>
          <input
            className="form-control"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com/file.pdf"
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Upload file</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="col-md-3">
          <button className="btn btn-primary w-100" disabled={saving}>
            {saving ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
