// src/pages/CertificateList.jsx
import { useEffect, useMemo, useState } from 'react';
import API from "../api/axiosInstance";

// Certificate Generator Global Reference
let certificateGenerator = null;

// Initialize Certificate Generator function
const initCertificateGenerator = async () => {
  if (certificateGenerator) return certificateGenerator;

  const canvasElement = document.getElementById('certCanvas');
  if (!canvasElement) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (window.CertificateGenerator) {
    certificateGenerator = window.CertificateGenerator;
    try {
      await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
      console.log('Certificate template loaded successfully');
      return certificateGenerator;
    } catch (err) {
      console.warn('Certificate template not found:', err);
      return certificateGenerator;
    }
  }

  return new Promise((resolve) => {
    const loadCertScript = async () => {
      const certScript = document.createElement('script');
      certScript.src = '/certificate-generator.js';
      certScript.onload = async () => {
        if (window.CertificateGenerator) {
          certificateGenerator = window.CertificateGenerator;
          try {
            await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
            console.log('Certificate template loaded successfully');
          } catch (err) {
            console.warn('Certificate template not found:', err);
          }
        }
        resolve(certificateGenerator);
      };
      document.body.appendChild(certScript);
    };

    if (!window.jspdf) {
      const jspdfScript = document.createElement('script');
      jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jspdfScript.onload = loadCertScript;
      document.body.appendChild(jspdfScript);
    } else {
      loadCertScript();
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Build the studentData object that CertificateGenerator expects,
// from a saved certificate record. Used by both download and preview.
// ─────────────────────────────────────────────────────────────────────────────
const buildStudentData = (certificate) => ({
  centerName:           certificate.centerName || '',
  atcName:              certificate.atcName || certificate.centerName || '',
  studentNameCombined:  certificate.fatherName
                          ? `${certificate.name} S/O, D/O, W/O ${certificate.fatherName}`
                          : (certificate.name || ''),
  courseName:           certificate.courseName     || '',
  grade:                certificate.grade          || '',
  courseDuration:       certificate.courseDuration || '',
  coursePeriodFrom:     certificate.coursePeriodFrom || '',
  coursePeriodTo:       certificate.coursePeriodTo   || '',
  certificateNumber:    certificate.certificateNumber || '',
  dateOfIssue:          certificate.issueDate         || '',
  photo:                certificate.photo              || '',
});

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-IN');
}

function CertificateModal({ show, onClose, onSaved, initial }) {
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [sessionFrom, setSessionFrom] = useState('');
  const [sessionTo, setSessionTo] = useState('');
  const [grade, setGrade] = useState('');
  const [courseDuration, setCourseDuration] = useState('');
  const [coursePeriodFrom, setCoursePeriodFrom] = useState('');
  const [coursePeriodTo, setCoursePeriodTo] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [centerName, setCenterName] = useState('');
  const [atcName, setAtcName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  useEffect(() => {
    if (!show) return;
    setError('');
    setSaving(false);

    if (initial) {
      setName(initial.name || '');
      setFatherName(initial.fatherName || '');
      setCourseName(initial.courseName || '');
      setSessionFrom(initial.sessionFrom ? String(initial.sessionFrom) : '');
      setSessionTo(initial.sessionTo ? String(initial.sessionTo) : '');
      setGrade(initial.grade || '');
      setCourseDuration(initial.courseDuration || '');
      setCoursePeriodFrom(initial.coursePeriodFrom ? new Date(initial.coursePeriodFrom).toISOString().slice(0, 10) : '');
      setCoursePeriodTo(initial.coursePeriodTo ? new Date(initial.coursePeriodTo).toISOString().slice(0, 10) : '');
      setEnrollmentNumber(initial.enrollmentNumber || '');
      setCertificateNumber(initial.certificateNumber || '');
      setIssueDate(initial.issueDate ? new Date(initial.issueDate).toISOString().slice(0, 10) : '');
      setCenterName(initial.centerName || '');
      setAtcName(initial.atcName || '');
    } else {
      setName(''); setFatherName(''); setCourseName('');
      setSessionFrom(''); setSessionTo(''); setGrade('');
      setCourseDuration(''); setCoursePeriodFrom(''); setCoursePeriodTo('');
      setEnrollmentNumber(''); setCertificateNumber(''); setIssueDate('');
      setCenterName(''); setAtcName('');
    }
  }, [show, initial]);

  if (!show) return null;

  const validate = () => {
    if (!name.trim())             { setError('Name is required.');              return false; }
    if (!fatherName.trim())       { setError("Father's Name is required.");     return false; }
    if (!courseName.trim())       { setError('Course Name is required.');       return false; }
    if (!sessionFrom)             { setError('Session From is required.');      return false; }
    if (!sessionTo)               { setError('Session To is required.');        return false; }
    if (!grade.trim())            { setError('Grade is required.');             return false; }
    if (!courseDuration.trim())   { setError('Course Duration is required.');   return false; }
    if (!coursePeriodFrom)        { setError('Course Period From is required.'); return false; }
    if (!coursePeriodTo)          { setError('Course Period To is required.');  return false; }
    if (!enrollmentNumber.trim()) { setError('Enrollment Number is required.'); return false; }
    if (!certificateNumber.trim()){ setError('Certificate Number is required.'); return false; }
    if (!issueDate)               { setError('Issue Date is required.');        return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);

    try {
      // Store only a low-res preview image in DB (not used for download)
      let certificateImage = null;
      await initCertificateGenerator();
      if (certificateGenerator) {
        try {
          const studentNameCombined = fatherName
            ? `${name} S/O, D/O, W/O ${fatherName}`
            : name;

          let studentPhoto = '';
          try {
            const res = await API.get('/students');
            const allStudents = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
            const student = allStudents.find(s =>
              (s.enrollmentNumber || s.rollNumber || '').toLowerCase() === enrollmentNumber.trim().toLowerCase()
            );
            if (student && student.photo) studentPhoto = student.photo;
          } catch (lookupErr) {
            console.warn('Could not lookup student photo:', lookupErr);
          }

const studentData = {
             centerName: '',
             atcName: atcName || '',
             studentNameCombined,
             courseName: courseName.trim(),
             grade: grade.trim(),
             courseDuration: courseDuration.trim(),
             coursePeriodFrom,
             coursePeriodTo,
             certificateNumber: certificateNumber.trim(),
             dateOfIssue: issueDate,
             photo: studentPhoto,
           };
          // Low quality for DB preview only — download re-renders at full quality
          certificateImage = await certificateGenerator.getDataURL(studentData, 0.4);
        } catch (imgErr) {
          console.warn('Could not generate certificate image:', imgErr);
        }
      }

      const payload = {
        name: name.trim(),
        fatherName: fatherName.trim(),
        courseName: courseName.trim(),
        sessionFrom: parseInt(sessionFrom),
        sessionTo: parseInt(sessionTo),
        grade: grade.trim(),
        courseDuration: courseDuration.trim(),
        coursePeriodFrom,
        coursePeriodTo,
        enrollmentNumber: enrollmentNumber.trim(),
        certificateNumber: certificateNumber.trim(),
        issueDate,
        centerName: centerName || '',
        atcName: atcName || '',
        certificateImage,
      };

      let saved;
      if (initial && (initial._id || initial.id)) {
        const id = initial._id || initial.id;
        saved = await API.unwrap(API.put(`/certificates/${id}`, payload));
      } else {
        saved = await API.unwrap(API.post('/certificates', payload));
      }

      onSaved(saved);
    } catch (err) {
      console.error('save certificate error:', err);
      setError(err.userMessage || 'Failed to save certificate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{initial ? 'Edit Certificate' : 'Create Certificate'}</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={saving} />
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-danger" role="alert">{error}</div>}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name *</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Father's Name *</label>
                  <input type="text" className="form-control" value={fatherName} onChange={(e) => setFatherName(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Course Name *</label>
                  <input type="text" className="form-control" value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Session From *</label>
                  <select className="form-select" value={sessionFrom} onChange={(e) => setSessionFrom(e.target.value)} required>
                    <option value="">Select Year</option>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Session To *</label>
                  <select className="form-select" value={sessionTo} onChange={(e) => setSessionTo(e.target.value)} required>
                    <option value="">Select Year</option>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Grade *</label>
                  <input type="text" className="form-control" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g., A, A+, First Division" required />
                </div>
<div className="col-md-6">
                   <label className="form-label">Course Duration *</label>
                   <input type="text" className="form-control" value={courseDuration} onChange={(e) => setCourseDuration(e.target.value)} required />
                 </div>
                 <div className="col-md-6">
                   <label className="form-label">Center Name</label>
                   <input type="text" className="form-control" value={centerName} onChange={(e) => setCenterName(e.target.value)} placeholder="Center Name" />
                 </div>
                 <div className="col-md-6">
                   <label className="form-label">ATC Name</label>
                   <input type="text" className="form-control" value={atcName} onChange={(e) => setAtcName(e.target.value)} placeholder="ATC Name" />
                 </div>
                 <div className="col-md-6">
                  <label className="form-label">Course Period From *</label>
                  <input type="date" className="form-control" value={coursePeriodFrom} onChange={(e) => setCoursePeriodFrom(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Course Period To *</label>
                  <input type="date" className="form-control" value={coursePeriodTo} onChange={(e) => setCoursePeriodTo(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Enrollment Number *</label>
                  <input type="text" className="form-control" value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Certificate Number *</label>
                  <input type="text" className="form-control" value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Issue Date *</label>
                  <input type="date" className="form-control" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CertificateViewModal
// KEY FIX: handleDownload now re-renders the certificate via CertificateGenerator
// instead of re-compressing the low-quality DB preview image.
// ─────────────────────────────────────────────────────────────────────────────
function CertificateViewModal({ show, onClose, certificate }) {
  const [downloading, setDownloading] = useState(false);

  if (!show || !certificate) return null;

  const handlePrint = () => {
    if (certificate.certificateImage) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${certificate.certificateNumber}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { margin: 0; padding: 0; }
              img { max-width: 100%; height: auto; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <img src="${certificate.certificateImage}" />
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await initCertificateGenerator();

      if (!certificateGenerator) {
        alert('Certificate generator not available. Please refresh the page.');
        return;
      }

      // The certificate record does not store the photo — it only has
      // enrollmentNumber. Fetch the matching student to get their photo.
      let studentPhoto = '';
      try {
        const res = await API.get('/students');
        const allStudents = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data) ? res.data.data : [];
        const student = allStudents.find(s =>
          (s.enrollmentNumber || s.rollNumber || '').toLowerCase() ===
          (certificate.enrollmentNumber || '').toLowerCase()
        );
        if (student?.photo) {
          studentPhoto = student.photo;
          console.log('Student photo found for:', certificate.enrollmentNumber);
        } else {
          console.warn('No photo found for enrollment:', certificate.enrollmentNumber);
        }
      } catch (lookupErr) {
        console.warn('Could not fetch student photo:', lookupErr);
      }

      const studentData = {
        ...buildStudentData(certificate),
        photo: studentPhoto,
      };
      console.log('Downloading PDF for:', studentData.studentNameCombined, '| photo:', !!studentPhoto);

      await certificateGenerator.download(studentData);

    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download certificate: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-xl" role="document" style={{ maxWidth: '90%' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">View Certificate - {certificate.certificateNumber}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="text-center mb-3">
              <button className="btn btn-primary me-2" onClick={handlePrint}>
                Print Certificate
              </button>
              <button
                className="btn btn-success"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Generating PDF…
                  </>
                ) : (
                  'Download Certificate'
                )}
              </button>
            </div>

            {/* Preview uses the stored low-res DB image — fine for on-screen viewing */}
            {certificate.certificateImage ? (
              <div className="text-center">
                <img
                  src={certificate.certificateImage}
                  alt="Certificate"
                  style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc' }}
                />
              </div>
            ) : (
              <div className="p-4 border">
                <div className="text-center">
                  <h5 className="text-uppercase fw-bold">Certificate of Completion</h5>
                  <p className="text-muted">This is to certify that</p>
                  <h4 className="fw-bold text-primary mb-3">{certificate.name}</h4>
                  <p className="mb-2">Son/Daughter of <strong>{certificate.fatherName}</strong></p>
                  <p className="mb-2">has successfully completed the course</p>
                  <h5 className="fw-bold mb-3">{certificate.courseName}</h5>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <p><strong>Session:</strong> {certificate.sessionFrom}-{certificate.sessionTo}</p>
                    <p><strong>Grade:</strong> {certificate.grade}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Enrollment No:</strong> {certificate.enrollmentNumber}</p>
                    <p><strong>Certificate No:</strong> {certificate.certificateNumber}</p>
                    <p><strong>Issue Date:</strong> {fmtDate(certificate.issueDate)}</p>
                    <p><strong>Center:</strong> {certificate.centerName}</p>
                    <p><strong>ATC:</strong> {certificate.atcName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificateList() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCert, setViewingCert] = useState(null);
  const [editing, setEditing] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await API.unwrap(API.get('/certificates'));
      const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setCerts(arr);
    } catch (err) {
      console.error('fetch certificates', err);
      setMsg(err.userMessage || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const filteredCerts = useMemo(() => {
    if (!search.trim()) return certs;
    const s = search.trim().toLowerCase();
    return certs.filter((c) =>
      (c.enrollmentNumber || '').toLowerCase().includes(s) ||
      (c.certificateNumber || '').toLowerCase().includes(s) ||
      (c.name || '').toLowerCase().includes(s) ||
      (c.courseName || '').toLowerCase().includes(s)
    );
  }, [certs, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certificate?')) return;
    try {
      await API.delete(`/certificates/${id}`);
      setCerts((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setMsg('Certificate deleted.');
    } catch (err) {
      console.error('delete certificate error:', err);
      setMsg(err.userMessage || 'Failed to delete certificate');
    }
  };

  const handleView = (cert) => {
    setViewingCert(cert);
    setShowViewModal(true);
  };

  const handleSaved = (saved) => {
    if (!saved || !saved._id) {
      setShowModal(false);
      loadAll();
      return;
    }
    setCerts((prev) => {
      const idx = prev.findIndex((c) => (c._id || c.id) === (saved._id || saved.id));
      if (idx === -1) return [saved, ...prev];
      const copy = [...prev];
      copy[idx] = saved;
      return copy;
    });
    setShowModal(false);
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
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
                placeholder="Search certificates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-outline-secondary" onClick={loadAll} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {msg && <div className="alert alert-info">{msg}</div>}

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
                        <th>Renewal Date</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCerts.map((c) => (
                        <tr key={c._id || c.id}>
                          <td>{c.name}</td>
                          <td>{c.courseName}</td>
                          <td>{c.sessionFrom}-{c.sessionTo}</td>
                          <td>{c.grade}</td>
                          <td>{c.enrollmentNumber}</td>
                          <td>{c.certificateNumber}</td>
                          <td>{fmtDate(c.issueDate)}</td>
                          <td>{fmtDate(c.renewalDate)}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleView(c)}>
                              View
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c._id || c.id)}>
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

      {/* Hidden canvas for certificate rendering */}
      <canvas id="certCanvas" style={{ display: 'none' }}></canvas>
    </div>
  );
}