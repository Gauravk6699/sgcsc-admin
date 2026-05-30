// src/pages/AssignmentList.jsx
import { useEffect, useMemo, useState } from 'react';
import API from "../api/axiosInstance";

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-IN');
}

// Try to derive base URL (e.g. http://localhost:5000/api)
const API_BASE =
  (API && API.defaults && API.defaults.baseURL) || '/api';

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await API.unwrap(API.get('/assignments'));
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setAssignments(arr);
    } catch (err) {
      console.error('fetch assignments error:', err);
      setMsgType('danger');
      setMsg(err.userMessage || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return assignments;
    const s = search.trim().toLowerCase();
    return assignments.filter((a) => {
      const desc = a.description || '';
      const name = a.originalName || '';
      return (
        desc.toLowerCase().includes(s) || name.toLowerCase().includes(s)
      );
    });
  }, [assignments, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await API.delete(`/assignments/${id}`);
      setAssignments((prev) =>
        prev.filter((a) => (a._id || a.id) !== id)
      );
      setMsgType('success');
      setMsg('Assignment deleted.');
    } catch (err) {
      console.error('delete assignment error:', err);
      setMsgType('danger');
      setMsg(err.userMessage || 'Failed to delete assignment');
    }
  };

  const handleDownload = (id) => {
    const base = (API_BASE || '').replace(/\/$/, '');
    const url = `${base}/assignments/${id}/download`;
    window.open(url, '_blank');
  };

  const startEdit = (assignment) => {
    setEditingId(assignment._id || assignment.id);
    setEditingDescription(assignment.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDescription('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const payload = { description: editingDescription || '' };
      const updated = await API.unwrap(
        API.put(`/assignments/${editingId}`, payload)
      );

      setAssignments((prev) => {
        const idx = prev.findIndex(
          (a) => (a._id || a.id) === (updated._id || updated.id)
        );
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      });

      setMsgType('success');
      setMsg('Assignment updated.');
      cancelEdit();
    } catch (err) {
      console.error('update assignment error:', err);
      setMsgType('danger');
      setMsg(err.userMessage || 'Failed to update assignment');
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="mb-0">Assignments</h2>
              <div className="small text-muted">
                Download, edit description or delete assignments
              </div>
            </div>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: 260 }}
                placeholder="Search by name or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={loadAll}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {msg && (
            <div
              className={`alert alert-${
                msgType === 'danger'
                  ? 'danger'
                  : msgType === 'success'
                  ? 'success'
                  : 'info'
              }`}
            >
              {msg}
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center text-muted">
                  Loading assignments…
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No assignments found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>File Name</th>
                        <th>Description</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a) => {
                        const id = a._id || a.id;
                        const sizeKB = a.size
                          ? `${Math.round(a.size / 1024)} KB`
                          : '-';
                        const isEditing = editingId === id;

                        return (
                          <tr key={id}>
                            <td>{a.originalName || '-'}</td>
                            <td style={{ maxWidth: 320 }}>
                              {isEditing ? (
                                <textarea
                                  className="form-control form-control-sm"
                                  rows={2}
                                  value={editingDescription}
                                  onChange={(e) =>
                                    setEditingDescription(e.target.value)
                                  }
                                />
                              ) : (
                                <span className="text-muted">
                                  {a.description || '-'}
                                </span>
                              )}
                            </td>
                            <td>{sizeKB}</td>
                            <td>{fmtDate(a.createdAt)}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-success me-2"
                                onClick={() => handleDownload(id)}
                              >
                                Download
                              </button>
                              {isEditing ? (
                                <>
                                  <button
                                    className="btn btn-sm btn-primary me-1"
                                    onClick={saveEdit}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-sm btn-outline-primary me-2"
                                    onClick={() => startEdit(a)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(id)}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
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
            Uses <code>GET /assignments</code>,{' '}
            <code>PUT /assignments/:id</code>,{' '}
            <code>DELETE /assignments/:id</code>, and{' '}
            <code>GET /assignments/:id/download</code>.
          </div> */}
        </div>
      </div>
    </div>
  );
}
