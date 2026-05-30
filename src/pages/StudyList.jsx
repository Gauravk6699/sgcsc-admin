import { useEffect, useMemo, useState } from "react";
import API from "../api/axiosInstance";

function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN");
}

export default function StudyList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [search, setSearch] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setMsg("");
    try {
      const data = await API.unwrap(API.get("/study-materials"));
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetch study materials", err);
      setMsgType("danger");
      setMsg(err.userMessage || "Failed to fetch study materials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const s = search.toLowerCase();
    return items.filter((m) => {
      return (
        (m.name || "").toLowerCase().includes(s) ||
        (m.description || "").toLowerCase().includes(s) ||
        (m.type || "").toLowerCase().includes(s)
      );
    });
  }, [items, search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this study material?")) return;
    try {
      await API.delete(`/study-materials/${id}`);
      setItems((prev) => prev.filter((m) => (m._id || m.id) !== id));
      setMsgType("success");
      setMsg("Deleted.");
    } catch (err) {
      console.error("delete study material", err);
      setMsgType("danger");
      setMsg(err.userMessage || "Delete failed");
    }
  };

  /**
   * 🔥 FORCE DOWNLOAD
   * Uses backend: GET /study-materials/:id/download
   */
  const handleDownload = (id) => {
    const base = API.defaults.baseURL.replace(/\/$/, "");
    const url = `${base}/study-materials/${id}/download`;
    window.open(url, "_blank");
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h2 className="mb-0">Study Material – List</h2>
          <div className="small text-muted">
            Search, download and manage uploaded study materials
          </div>
        </div>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: 260 }}
            placeholder="Search by name / description / type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn btn-outline-secondary"
            onClick={loadAll}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

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
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">
              Loading study materials…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-muted">
              No study materials found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-primary">
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Link</th>
                    <th>Uploaded</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const id = m._id || m.id;
                    return (
                      <tr key={id}>
                        <td>{m.name || "-"}</td>
                        <td>{m.description || "-"}</td>
                        <td>{m.type || "-"}</td>
                        <td>
                          {m.linkUrl ? (
                            <a
                              href={m.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open link
                            </a>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>{fmtDate(m.createdAt)}</td>
                        <td className="text-center">
                          {m.fileName && (
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleDownload(id)}
                            >
                              Download
                            </button>
                          )}
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
          )}
        </div>
      </div>

      {/* <div className="mt-3 small text-muted">
        Download uses <code>GET /study-materials/:id/download</code> to force file
        download.
      </div> */}
    </div>
  );
}
