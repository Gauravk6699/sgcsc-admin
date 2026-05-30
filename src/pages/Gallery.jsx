// src/pages/Gallery.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export default function Gallery() {
  const navigate = useNavigate();

  const [gallery, setGallery] = useState([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadsBase =
    process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

  const fetchGallery = async () => {
    setLoading(true);
    setError("");
    try {
      const params =
        filterCategory === "all" ? {} : { category: filterCategory };

      const res = await API.get("/gallery", { params });
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      setGallery(data);
    } catch (err) {
      console.error("fetchGallery error:", err);
      setError("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await API.delete(`/gallery/${id}`);
      setGallery((prev) =>
        prev.filter((g) => (g._id || g.id) !== id)
      );
    } catch {
      alert("Failed to delete image");
    }
  };

  const getImageSrc = (item) => {
    if (!item?.image) return "";
    return item.image.startsWith("http")
      ? item.image
      : `${uploadsBase}/uploads/${item.image}`;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Gallery</h2>

        <select
          className="form-select"
          style={{ maxWidth: 220 }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="gallery">Gallery</option>
          <option value="affiliation">Affiliation</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : gallery.length === 0 ? (
        <div className="text-muted">No images found</div>
      ) : (
        <div className="row">
          {gallery.map((img) => {
            const id = img._id || img.id;
            return (
              <div key={id} className="col-md-3 mb-4">
                <div className="card h-100 shadow-sm">
                  <div style={{ height: 160, overflow: "hidden" }}>
                    <img
                      src={getImageSrc(img)}
                      alt={img.title || "gallery"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <div className="card-body p-2">
                    <strong className="small d-block text-truncate">
                      {img.title || "Untitled"}
                    </strong>

                    <span className="badge bg-light text-muted small">
                      {img.category}
                    </span>

                    <div className="d-flex justify-content-between mt-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          navigate(`/gallery/categories/create?id=${id}`)

                        }
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
