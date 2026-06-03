// src/pages/CertificateList.jsx
//
// Fix summary vs original:
//  • centerName === atcName — one field, one value, no duplication.
//  • Modal preview renders LIVE via CertificateGenerator (not stale DB image),
//    so what you see is pixel-identical to what downloads.
//  • buildStudentData is the single source of truth for field mapping.
//  • initCertificateGenerator is shared across all actions via a module-level
//    singleton promise — no double-load race conditions.

import { useEffect, useMemo, useRef, useState } from 'react';
import API from "../api/axiosInstance";

// ── CertificateGenerator singleton ────────────────────────────────────────────
let _certGenPromise = null;

function initCertificateGenerator() {
  if (_certGenPromise) return _certGenPromise;

  _certGenPromise = (async () => {
    // Ensure canvas exists in DOM
    if (!document.getElementById('certCanvas')) {
      const cv = document.createElement('canvas');
      cv.id = 'certCanvas';
      cv.style.display = 'none';
      document.body.appendChild(cv);
    }

    // If already available (e.g. script tag in index.html) just load template
    if (window.CertificateGenerator) {
      await window.CertificateGenerator.loadTemplate('/student-certificate-template.jpeg');
      return window.CertificateGenerator;
    }

    // Otherwise dynamically load jsPDF → certificate-generator.js
    const loadScript = (src) =>
      new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = res;
        s.onerror = () => rej(new Error('Failed to load ' + src));
        document.body.appendChild(s);
      });

    if (!window.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    if (!window.QRious) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js');
    }
    if (!window.CertificateGenerator) {
      await loadScript('/certificate-generator.js');
    }

    if (window.CertificateGenerator) {
      await window.CertificateGenerator.loadTemplate('/student-certificate-template.jpeg');
      return window.CertificateGenerator;
    }
    throw new Error('CertificateGenerator unavailable after loading scripts.');
  })();

  return _certGenPromise;
}

// ── Data mapper ───────────────────────────────────────────────────────────────
//
// Single source of truth: converts a DB certificate record into the flat
// object CertificateGenerator._render() expects.
// centerName and atcName are the same field; check every known alias so
// records saved under any field name (old or new) all render correctly.
//
function buildStudentData(cert) {
  // Walk every known field alias — covers records saved under any schema version.
  // The user-visible fallback matches what was printed on old certificates.
  const orgName = cert.centerName || cert.atcName || cert.center || cert.organisation
                  || cert.instituteName || cert.institute || '';
  return {
    centerName:          orgName,
    atcName:             orgName,
    studentNameCombined: cert.fatherName
      ? `${cert.name} S/O, D/O, W/O ${cert.fatherName}`
      : (cert.name || ''),
    courseName:      cert.courseName      || '',
    grade:           cert.grade           || '',
    courseDuration:  cert.courseDuration  || '',
    coursePeriodFrom: cert.coursePeriodFrom || '',
    coursePeriodTo:   cert.coursePeriodTo  || '',
    certificateNumber: cert.certificateNumber || '',
    dateOfIssue:     cert.issueDate        || '',
    photo:           cert.photo            || '',
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN');
}

async function fetchStudentPhoto(enrollmentNumber) {
  try {
    const res = await API.get('/students');
    const list = Array.isArray(res.data) ? res.data
               : Array.isArray(res.data?.data) ? res.data.data : [];
    const student = list.find(s =>
      (s.enrollmentNo || s.rollNumber || '').toLowerCase() ===
      (enrollmentNumber || '').toLowerCase()
    );
    return student?.photo || '';
  } catch {
    return '';
  }
}

// ── CertificateModal (create / edit) ─────────────────────────────────────────
function CertificateModal({ show, onClose, onSaved, initial }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  useEffect(() => {
    if (!show) return;
    setError('');
    setSaving(false);
    setForm(initial ? {
      name:              initial.name              || '',
      fatherName:        initial.fatherName        || '',
      courseName:        initial.courseName        || '',
      sessionFrom:       initial.sessionFrom ? String(initial.sessionFrom) : '',
      sessionTo:         initial.sessionTo   ? String(initial.sessionTo)   : '',
      grade:             initial.grade             || '',
      courseDuration:    initial.courseDuration    || '',
      coursePeriodFrom:  initial.coursePeriodFrom  ? new Date(initial.coursePeriodFrom).toISOString().slice(0, 10) : '',
      coursePeriodTo:    initial.coursePeriodTo    ? new Date(initial.coursePeriodTo).toISOString().slice(0, 10)   : '',
      enrollmentNumber:  initial.enrollmentNumber  || '',
      certificateNumber: initial.certificateNumber || '',
      issueDate:         initial.issueDate         ? new Date(initial.issueDate).toISOString().slice(0, 10) : '',
      // centerName is the single org field — atcName is discarded
      centerName:        initial.centerName || initial.atcName || '',
    } : {
      name:'', fatherName:'', courseName:'', sessionFrom:'', sessionTo:'',
      grade:'', courseDuration:'', coursePeriodFrom:'', coursePeriodTo:'',
      enrollmentNumber:'', certificateNumber:'', issueDate:'', centerName:'Shree ganpati computer and study Centre'
    });
  }, [show, initial]);

  if (!show) return null;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const required = [
      ['name','Name'],['fatherName',"Father's Name"],['courseName','Course Name'],
      ['sessionFrom','Session From'],['sessionTo','Session To'],['grade','Grade'],
      ['courseDuration','Course Duration'],['coursePeriodFrom','Course Period From'],
      ['coursePeriodTo','Course Period To'],['enrollmentNumber','Enrollment Number'],
      ['certificateNumber','Certificate Number'],['issueDate','Issue Date'],
      ['centerName','Center / ATC Name'],
    ];
    for (const [k, label] of required) {
      if (!form[k]?.trim?.() && !form[k]) { setError(`${label} is required.`); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      // Generate a fresh certificate preview image to store in DB
      let certificateImage = null;
      try {
        const gen = await initCertificateGenerator();
        if (gen) {
          // Look up student photo
          const photo = await fetchStudentPhoto(form.enrollmentNumber);
          const studentData = {
            centerName: form.centerName || '',
            atcName:    form.centerName || '',
            studentNameCombined: form.fatherName
              ? `${form.name} S/O, D/O, W/O ${form.fatherName}`
              : form.name,
            courseName:        form.courseName,
            grade:             form.grade,
            courseDuration:    form.courseDuration,
            coursePeriodFrom:  form.coursePeriodFrom,
            coursePeriodTo:    form.coursePeriodTo,
            certificateNumber: form.certificateNumber,
            dateOfIssue:       form.issueDate,
            photo,
          };
          certificateImage = await gen.getDataURL(studentData, 0.4);
        }
      } catch (imgErr) {
        console.warn('[CertModal] Preview image generation failed:', imgErr);
      }

      const payload = {
        name:              form.name.trim(),
        fatherName:        form.fatherName.trim(),
        courseName:        form.courseName.trim(),
        sessionFrom:       parseInt(form.sessionFrom),
        sessionTo:         parseInt(form.sessionTo),
        grade:             form.grade.trim(),
        courseDuration:    form.courseDuration.trim(),
        coursePeriodFrom:  form.coursePeriodFrom,
        coursePeriodTo:    form.coursePeriodTo,
        enrollmentNumber:  form.enrollmentNumber.trim(),
        certificateNumber: form.certificateNumber.trim(),
        issueDate:         form.issueDate,
        centerName:        form.centerName || '',
        atcName:           form.centerName || '',   // keep atcName in sync
        certificateImage,
      };

      let saved;
      if (initial && (initial._id || initial.id)) {
        saved = await API.unwrap(API.put(`/certificates/${initial._id || initial.id}`, payload));
      } else {
        saved = await API.unwrap(API.post('/certificates', payload));
      }
      onSaved(saved);
    } catch (err) {
      console.error('[CertModal] Save error:', err);
      setError(err.userMessage || 'Failed to save certificate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{initial ? 'Edit Certificate' : 'Create Certificate'}</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={saving} />
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name *</label>
                  <input className="form-control" value={form.name || ''} onChange={set('name')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Father's Name *</label>
                  <input className="form-control" value={form.fatherName || ''} onChange={set('fatherName')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Course Name *</label>
                  <input className="form-control" value={form.courseName || ''} onChange={set('courseName')} required />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Session From *</label>
                  <select className="form-select" value={form.sessionFrom || ''} onChange={set('sessionFrom')} required>
                    <option value="">Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Session To *</label>
                  <select className="form-select" value={form.sessionTo || ''} onChange={set('sessionTo')} required>
                    <option value="">Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Grade *</label>
                  <input className="form-control" value={form.grade || ''} onChange={set('grade')} placeholder="e.g. A, A+, First Division" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Course Duration *</label>
                  <input className="form-control" value={form.courseDuration || ''} onChange={set('courseDuration')} required />
                </div>
                {/* Single center/org field — replaces the old centerName + atcName pair */}
                <div className="col-md-6">
                  <label className="form-label">Center / ATC Name</label>
                  <input className="form-control" value={form.centerName || ''} onChange={set('centerName')} placeholder="Center or ATC Name" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Course Period From *</label>
                  <input type="date" className="form-control" value={form.coursePeriodFrom || ''} onChange={set('coursePeriodFrom')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Course Period To *</label>
                  <input type="date" className="form-control" value={form.coursePeriodTo || ''} onChange={set('coursePeriodTo')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Enrollment Number *</label>
                  <input className="form-control" value={form.enrollmentNumber || ''} onChange={set('enrollmentNumber')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Certificate Number *</label>
                  <input className="form-control" value={form.certificateNumber || ''} onChange={set('certificateNumber')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Issue Date *</label>
                  <input type="date" className="form-control" value={form.issueDate || ''} onChange={set('issueDate')} required />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── CertificateViewModal ───────────────────────────────────────────────────────
//
// KEY FIX: The preview image is rendered LIVE via CertificateGenerator — it is
// NOT the stale low-quality DB image.  This guarantees pixel-identical output
// between view and download.
//
function CertificateViewModal({ show, onClose, certificate }) {
  const [previewSrc,  setPreviewSrc]  = useState(null);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const prevCertRef = useRef(null);

  // Regenerate live preview whenever the modal opens for a different certificate
  useEffect(() => {
    if (!show || !certificate) return;
    if (prevCertRef.current === certificate._id) return;
    prevCertRef.current = certificate._id;

    let cancelled = false;
    setPreviewSrc(null);
    setLoadingPrev(true);

    (async () => {
      try {
        const gen = await initCertificateGenerator();
        const photo = await fetchStudentPhoto(certificate.enrollmentNumber);
        const studentData = { ...buildStudentData(certificate), photo };
        const dataUrl = await gen.getImageDataURL(studentData);
        if (!cancelled) setPreviewSrc(dataUrl);
      } catch (err) {
        console.error('[CertViewModal] Preview generation failed:', err);
        // Fall back to stored DB image if live render fails
        if (!cancelled && certificate.certificateImage) {
          setPreviewSrc(certificate.certificateImage);
        }
      } finally {
        if (!cancelled) setLoadingPrev(false);
      }
    })();

    return () => { cancelled = true; };
  }, [show, certificate]);

  if (!show || !certificate) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const gen = await initCertificateGenerator();
      const photo = await fetchStudentPhoto(certificate.enrollmentNumber);
      const studentData = { ...buildStudentData(certificate), photo };
      await gen.download(studentData);
    } catch (err) {
      console.error('[CertViewModal] Download error:', err);
      alert('Failed to download certificate: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-xl" style={{ maxWidth: '90%' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Certificate — {certificate.certificateNumber}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="text-center mb-3 d-flex justify-content-center gap-2">
              <button
                className="btn btn-success"
                onClick={handleDownload}
                disabled={downloading || loadingPrev}
              >
                {downloading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Generating PDF…</>
                  : 'Download PDF'}
              </button>
            </div>

            <div className="text-center">
              {loadingPrev ? (
                <div className="py-5 text-muted">
                  <div className="spinner-border mb-2" />
                  <div>Rendering certificate…</div>
                </div>
              ) : previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Certificate preview"
                  style={{ maxWidth: '100%', height: 'auto', border: '1px solid #dee2e6' }}
                />
              ) : (
                // Minimal text fallback if rendering fails entirely
                <div className="p-4 border rounded text-start">
                  <h5 className="text-uppercase fw-bold text-center">Certificate of Completion</h5>
                  <hr />
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <p><strong>Name:</strong> {certificate.name}</p>
                      <p><strong>Father's Name:</strong> {certificate.fatherName}</p>
                      <p><strong>Course:</strong> {certificate.courseName}</p>
                      <p><strong>Grade:</strong> {certificate.grade}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Session:</strong> {certificate.sessionFrom}–{certificate.sessionTo}</p>
                      <p><strong>Enrollment No:</strong> {certificate.enrollmentNumber}</p>
                      <p><strong>Certificate No:</strong> {certificate.certificateNumber}</p>
                      <p><strong>Issue Date:</strong> {fmtDate(certificate.issueDate)}</p>
                      <p><strong>Center / ATC:</strong> {certificate.centerName || certificate.atcName}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────
export default function CertificateList() {
  const [certs,        setCerts]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState('');
  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCert,  setViewingCert]  = useState(null);
  const [editing,      setEditing]      = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await API.unwrap(API.get('/certificates'));
      const arr  = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setCerts(arr);
    } catch (err) {
      console.error('[CertList] fetch error:', err);
      setMsg(err.userMessage || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const filteredCerts = useMemo(() => {
    if (!search.trim()) return certs;
    const s = search.trim().toLowerCase();
    return certs.filter(c =>
      (c.enrollmentNumber  || '').toLowerCase().includes(s) ||
      (c.certificateNumber || '').toLowerCase().includes(s) ||
      (c.name              || '').toLowerCase().includes(s) ||
      (c.courseName        || '').toLowerCase().includes(s)
    );
  }, [certs, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certificate?')) return;
    try {
      await API.delete(`/certificates/${id}`);
      setCerts(prev => prev.filter(c => (c._id || c.id) !== id));
      setMsg('Certificate deleted.');
    } catch (err) {
      setMsg(err.userMessage || 'Failed to delete certificate');
    }
  };

  const handleView = (cert) => { setViewingCert(cert); setShowViewModal(true); };

  const handleEdit = (cert) => { setEditing(cert); setShowModal(true); };

  const handleSaved = (saved) => {
    if (!saved?._id) { setShowModal(false); loadAll(); return; }
    setCerts(prev => {
      const idx = prev.findIndex(c => (c._id || c.id) === (saved._id || saved.id));
      if (idx === -1) return [saved, ...prev];
      const copy = [...prev]; copy[idx] = saved; return copy;
    });
    setShowModal(false);
    setEditing(null);
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="mb-0">Student Certificates</h2>
              <div className="small text-muted">View, search, edit and delete certificates</div>
            </div>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: 260 }}
                placeholder="Search certificates…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="btn btn-outline-secondary" onClick={loadAll} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
                + New Certificate
              </button>
            </div>
          </div>

          {msg && <div className="alert alert-info">{msg}</div>}

          {/* Table */}
          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center text-muted">Loading certificates…</div>
              ) : filteredCerts.length === 0 ? (
                <div className="p-4 text-center text-muted">No certificates found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Name</th>
                        <th>Course</th>
                        <th>Session</th>
                        <th>Grade</th>
                        <th>Enrollment No</th>
                        <th>Certificate No</th>
                        <th>Issue Date</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCerts.map(c => (
                        <tr key={c._id || c.id}>
                          <td>{c.name}</td>
                          <td>{c.courseName}</td>
                          <td>{c.sessionFrom}–{c.sessionTo}</td>
                          <td>{c.grade}</td>
                          <td>{c.enrollmentNumber}</td>
                          <td>{c.certificateNumber}</td>
                          <td>{fmtDate(c.issueDate)}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleView(c)}>View</button>
                            <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleEdit(c)}>Edit</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c._id || c.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CertificateModal
        show={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSaved={handleSaved}
        initial={editing}
      />

      <CertificateViewModal
        show={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingCert(null); }}
        certificate={viewingCert}
      />

      {/* Hidden canvas used by CertificateGenerator */}
      <canvas id="certCanvas" style={{ display: 'none' }} />
    </div>
  );
}