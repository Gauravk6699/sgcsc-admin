import { useEffect, useState } from 'react';
import API from "../api/axiosInstance";

const DEV_PLACEHOLDER =
  'https://via.placeholder.com/80x80.png?text=Photo';

let API_ORIGIN = '';
try {
  const base = API?.defaults?.baseURL || '';
  if (base) API_ORIGIN = new URL(base).origin;
} catch {
  API_ORIGIN = window.location.origin;
}

function imgUrl(url) {
  if (!url) return DEV_PLACEHOLDER;

  // Cloudinary URLs → open directly
  if (typeof url === 'string' && url.startsWith('http')) {
    return url;
  }

  // Fallback for legacy local uploads
  return `${API_ORIGIN}/uploads/${url}`;
}


function boolBadge(value, labelTrue = 'Yes', labelFalse = 'No') {
  if (value) {
    return <span className="badge bg-success">{labelTrue}</span>;
  }
  return <span className="badge bg-secondary">{labelFalse}</span>;
}

// simple helper to render a clickable badge for a document/image
function docBadge(label, filename) {
  if (!filename) return null;
  return (
    <a
      key={label}
      href={imgUrl(filename)}
      target="_blank"
      rel="noreferrer"
      className="badge bg-light border text-dark me-1 mb-1 d-inline-block"
      style={{ fontSize: '0.75rem' }}
    >
      {label}
    </a>
  );
}

function statusBadge(status) {
  const value = (status || 'pending').toLowerCase();

  switch (value) {
    case 'approved':
      return <span className="badge bg-success">Approved</span>;
    case 'rejected':
      return <span className="badge bg-danger">Rejected</span>;
    case 'pending':
    default:
      return <span className="badge bg-warning text-dark">Pending</span>;
  }
}


const emptyEdit = {
  instituteId: '',
  ownerName: '',
  instituteName: '',
  dob: '',
  aadharNumber: '',
  panNumber: '',
  address: '',
  state: '',
  district: '',
  operatorsCount: '',
  classRooms: '',
  totalComputers: '',
  centerSpace: '',
  whatsapp: '',
  contact: '',
  email: '',
  ownerQualification: '',
  hasReception: false,
  hasStaffRoom: false,
  hasWaterSupply: false,
  hasToilet: false,
  username: '',
  password: '',
  status: 'pending',
  balance: 0,

};

export default function FranchiseList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(null); 
  const [editForm, setEditForm] = useState(emptyEdit);
  const [showPassword, setShowPassword] = useState(false);


  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/franchises');
      const data = res.data;

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setItems(arr);
    } catch (err) {
      console.error('load franchises error:', err);
      setError(err.userMessage || 'Failed to load franchises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (f) => {
    setEditing(f);
    setEditError('');
    setEditForm({
      instituteId: f.instituteId || '',
      ownerName: f.ownerName || '',
      instituteName: f.instituteName || '',
      dob: f.dob ? String(f.dob).slice(0, 10) : '',
      aadharNumber: f.aadharNumber || '',
      panNumber: f.panNumber || '',
      address: f.address || '',
      state: f.state || '',
      district: f.district || '',
      operatorsCount: f.operatorsCount ?? '',
      classRooms: f.classRooms ?? '',
      totalComputers: f.totalComputers ?? '',
      centerSpace: f.centerSpace || '',
      whatsapp: f.whatsapp || '',
      contact: f.contact || '',
      email: f.email || '',
      ownerQualification: f.ownerQualification || '',
      hasReception: f.hasReception ?? false,
      hasStaffRoom: f.hasStaffRoom ?? false,
      hasWaterSupply: f.hasWaterSupply ?? false,
      hasToilet: f.hasToilet ?? false,
      username: f.username || '',
      password: '',
      status: f.status || 'pending',
      balance: f.balance ?? 0,


    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm(emptyEdit);
    setEditError('');
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    // keep PAN uppercase
    if (name === 'panNumber') {
      newValue = newValue.toUpperCase();
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;

    setSaving(true);
    setEditError('');

    try {
const payload = { ...editForm };

// do not overwrite password if empty
if (!payload.password) {
  delete payload.password;
}

const res = await API.put(
  `/franchises/${editing._id}`,
  payload
);

      const updated = res.data;


      const updatedData =
        updated && updated.data && updated.success ? updated.data : updated;

      setItems((prev) =>
        prev.map((f) => (f._id === updatedData._id ? updatedData : f))
      );
      closeEdit();
    } catch (err) {
      console.error('update franchise error:', err);
      setEditError(err.userMessage || 'Failed to update franchise');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this franchise?')) return;
    try {
      await API.delete(`/franchises/${id}`);
      setItems((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error('delete franchise error:', err);
      alert(err.userMessage || 'Failed to delete franchise');
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Franchise List</h2>
          <div className="small text-muted">
            View, edit and delete registered franchises
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">Loading franchises…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-muted">
              No franchises yet. Use &quot;Create Franchise&quot; to add one.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Institute ID</th>
                    <th>Institute</th>
                    <th>Owner</th>
                    <th>Location</th>
                    <th>Contact</th>
                    <th>Infra</th>
                    <th>Facilities</th>
                    <th>Status</th>  
                    {/* Photo column removed */}
                    <th>Docs</th>
                    <th>Balance (₹)</th>

                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f._id}>
                      <td>{f.instituteId}</td>
                      <td>
                        <div>{f.instituteName}</div>
                        {f.dob && (
                          <div className="small text-muted">
                            DOB: {String(f.dob).slice(0, 10)}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{f.ownerName}</div>
                      </td>
                      <td>
                        <div>{f.district}</div>
                        <div className="text-muted small">{f.state}</div>
                        <div className="text-muted small">
                          {f.address || ''}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          {f.contact || '-'}
                          {f.whatsapp ? ` / ${f.whatsapp}` : ''}
                        </div>
                        <div className="small text-muted">
                          {f.email || ''}
                        </div>
                      </td>
                      <td className="small">
                        <div>
                          Ops: {f.operatorsCount ?? 0}, Classrooms:{' '}
                          {f.classRooms ?? 0}
                        </div>
                        <div>Computers: {f.totalComputers ?? 0}</div>
                        <div className="text-muted small">
                          {f.centerSpace || ''}
                        </div>
                      </td>
                      <td className="small">
                        {boolBadge(f.hasReception, 'Reception', 'No Recp')}
                        &nbsp;
                        {boolBadge(f.hasStaffRoom, 'Staff', 'No Staff')}
                        <br />
                        {boolBadge(f.hasWaterSupply, 'Water', 'No Water')}
                        &nbsp;
                        {boolBadge(f.hasToilet, 'Toilet', 'No Toilet')}
                      </td>
                      <td>
                        {statusBadge(f.status)}
                      </td>

                      {/* Photo <td> removed */}
                      <td style={{ maxWidth: 180 }}>
                        {docBadge('Aadhar Front', f.aadharFront)}
                        {docBadge('Aadhar Back', f.aadharBack)}
                        {docBadge('PAN', f.panImage)}
                        {docBadge('Institute', f.institutePhoto)}
                        {docBadge('Owner Sign', f.ownerSign)}
                        {docBadge('Owner Image', f.ownerImage)}
                        {docBadge('Certificate', f.certificateFile)}
                      </td>
                      <td>
                        <span className="fw-semibold">
                          ₹{Number(f.balance || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openEdit(f)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(f._id)}
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

      {/* Edit modal */}
      {editing && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <form onSubmit={saveEdit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    Edit Franchise – {editing.instituteName}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEdit}
                  />
                </div>
                <div className="modal-body">
                  {editError && (
                    <div className="alert alert-danger" role="alert">
                      {editError}
                    </div>
                  )}

                  {/* Basic IDs */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Institute ID</label>
                      <input
                        type="text"
                        className="form-control"
                        name="instituteId"
                        value={editForm.instituteId}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Owner Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="ownerName"
                        value={editForm.ownerName}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Institute Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="instituteName"
                        value={editForm.instituteName}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  {/* Personal / IDs */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        name="dob"
                        value={editForm.dob}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Aadhar Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="aadharNumber"
                        value={editForm.aadharNumber}
                        onChange={handleEditChange}
                        maxLength={12}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">PAN Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="panNumber"
                        value={editForm.panNumber}
                        onChange={handleEditChange}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <label className="form-label">Full Address</label>
                    <textarea
                      className="form-control"
                      name="address"
                      rows={2}
                      value={editForm.address}
                      onChange={handleEditChange}
                    />
                  </div>

                  {/* Location / space */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        name="state"
                        value={editForm.state}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District</label>
                      <input
                        type="text"
                        className="form-control"
                        name="district"
                        value={editForm.district}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">
                        Space of Computer Center
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="centerSpace"
                        value={editForm.centerSpace}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  {/* Infra */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">
                        Number of Computer Operators
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="operatorsCount"
                        value={editForm.operatorsCount}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Class Rooms</label>
                      <input
                        type="number"
                        className="form-control"
                        name="classRooms"
                        value={editForm.classRooms}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Total Computers</label>
                      <input
                        type="number"
                        className="form-control"
                        name="totalComputers"
                        value={editForm.totalComputers}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">WhatsApp</label>
                      <input
                        type="text"
                        className="form-control"
                        name="whatsapp"
                        value={editForm.whatsapp}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Contact</label>
                      <input
                        type="text"
                        className="form-control"
                        name="contact"
                        value={editForm.contact}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  {/* Qualification + facilities */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Qualification of Institute Head
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="ownerQualification"
                        value={editForm.ownerQualification}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-6 d-flex flex-wrap align-items-center gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="editReception"
                          name="hasReception"
                          checked={editForm.hasReception}
                          onChange={handleEditChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="editReception"
                        >
                          Reception
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="editStaffRoom"
                          name="hasStaffRoom"
                          checked={editForm.hasStaffRoom}
                          onChange={handleEditChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="editStaffRoom"
                        >
                          Staff Room
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="editWater"
                          name="hasWaterSupply"
                          checked={editForm.hasWaterSupply}
                          onChange={handleEditChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="editWater"
                        >
                          Water Supply
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="editToilet"
                          name="hasToilet"
                          checked={editForm.hasToilet}
                          onChange={handleEditChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="editToilet"
                        >
                          Toilet
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Login */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        New Password (leave blank to keep existing)
                      </label>
                        <div className="input-group">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-control"
                            name="password"
                            value={editForm.password}
                            onChange={handleEditChange}
                            placeholder="Leave blank to keep existing"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPassword((prev) => !prev)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                          </button>
                        </div>

                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Franchise Status</label>
                        <select
                          className="form-select"
                          name="status"
                          value={editForm.status}
                          onChange={handleEditChange}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      {/* <div className="row g-3 mb-3"> */}
                      <div className="col-md-6">
                        <label className="form-label">Balance (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="balance"
                          value={editForm.balance}
                          onChange={handleEditChange}
                          min={0}
                        />
                        <div className="form-text">
                          Amount paid by franchise (admin controlled)
                        </div>
                      </div>
                    {/* </div> */}

                    </div>

                  </div>

                  {/* Existing docs quick view (read-only) */}
                  <div className="mb-2">
                    <label className="form-label">Uploaded Documents</label>
                    <div>
                      {docBadge('Aadhar Front', editing.aadharFront)}
                      {docBadge('Aadhar Back', editing.aadharBack)}
                      {docBadge('PAN', editing.panImage)}
                      {docBadge('Institute', editing.institutePhoto)}
                      {docBadge('Owner Sign', editing.ownerSign)}
                      {docBadge('Owner Image', editing.ownerImage)}
                      {docBadge('Certificate', editing.certificateFile)}
                    </div>
                    <div className="form-text">
                      (These are existing files; re-upload is handled on the
                      Create form or a separate update-docs feature.)
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
