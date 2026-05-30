import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export default function AddGalleryImage() {
  const navigate = useNavigate();
  const location = useLocation();

  const imageId = new URLSearchParams(location.search).get("id");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gallery");
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(imageId);

  useEffect(() => {
    if (!imageId) return;

    const loadImage = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await API.get(`/gallery/${imageId}`);

        console.log("RAW IMAGE RESPONSE 👉", res.data);

        const img =
          res.data?.data ||
          res.data?.image ||
          res.data?.item ||
          res.data;

        if (!img || typeof img !== "object") {
          throw new Error("Invalid image payload");
        }

        setTitle(img.title ?? "");
        setCategory(img.category ?? "gallery");
      } catch (err) {
        console.error("IMAGE LOAD FAILED ❌", err);
        setError(
          err?.response?.data?.message ||
          err.message ||
          "Failed to load image details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [imageId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Name is required");
      return;
    }

    if (!isEdit && !imageFile) {
      setError("Image is required");
      return;
    }

    try {
      setSaving(true);
      const form = new FormData();
      form.append("title", title.trim());
      form.append("category", category);
      if (imageFile) form.append("image", imageFile);

      if (isEdit) {
        await API.put(`/gallery/${imageId}`, form);
      } else {
        await API.post("/gallery", form);
      }

      navigate("/gallery");
    } catch (err) {
      console.error("SAVE FAILED ❌", err);
      setError(
        err?.response?.data?.message ||
        "Failed to save image"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <h2>{isEdit ? "Edit Image" : "Add Image"}</h2>

      {loading && <div>Loading image…</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-4 mt-3">
        <label className="form-label">
          Name <span className="text-danger">*</span>
        </label>
        <input
          className="form-control mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="form-label">
          Category <span className="text-danger">*</span>
        </label>
        <select
          className="form-select mb-3"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="gallery">Gallery</option>
          <option value="affiliation">Affiliation</option>
        </select>

        <label className="form-label">
          Upload Image {!isEdit && <span className="text-danger">*</span>}
        </label>
        <input
          type="file"
          className="form-control mb-3"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
