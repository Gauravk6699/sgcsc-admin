// src/pages/FranchiseCertificateList.jsx
import { useEffect, useMemo, useState } from 'react';
import API from "../api/axiosInstance";

// Franchise Certificate Generator Global Reference
let franchiseCertificateGenerator = null;

// Initialize Franchise Certificate Generator function
const initFranchiseCertificateGenerator = async () => {
  if (franchiseCertificateGenerator) return franchiseCertificateGenerator;

  // Ensure canvas is available before loading template
  const canvasElement = document.getElementById('franchiseCertCanvas');
  if (!canvasElement) {
    console.warn('Canvas element not found in DOM yet. Waiting...');
    // Wait for canvas to be available
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Check if already available on window
  if (window.FranchiseCertificateGenerator) {
    franchiseCertificateGenerator = window.FranchiseCertificateGenerator;
    try {
      await franchiseCertificateGenerator.loadTemplate('/franchise-certificate-template.jpeg');
      console.log('Franchise certificate template loaded successfully');
      return franchiseCertificateGenerator;
    } catch (err) {
      console.error('CRITICAL ERROR: Franchise certificate template not found:', err.message);
      console.error('Please upload franchise-certificate-template.jpeg to the public folder');
      throw new Error(`Template required: ${err.message}`);
    }
  }

  // Script not loaded yet, dynamically load it
  return new Promise((resolve, reject) => {
    // Load jspdf if not present
    if (!window.jspdf) {
      const jspdfScript = document.createElement('script');
      jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jspdfScript.onload = () => {
        // Load franchise-certificate-generator
        const certScript = document.createElement('script');
        certScript.src = '/franchise-certificate-generator.js';
        certScript.onload = async () => {
          if (window.FranchiseCertificateGenerator) {
            franchiseCertificateGenerator = window.FranchiseCertificateGenerator;
            try {
              await franchiseCertificateGenerator.loadTemplate('/franchise-certificate-template.jpeg');
              console.log('Franchise certificate template loaded successfully');
              resolve(franchiseCertificateGenerator);
            } catch (err) {
              console.error('CRITICAL ERROR: Franchise certificate template not found:', err.message);
              reject(new Error(`Template required: ${err.message}`));
            }
          } else {
            reject(new Error('Franchise certificate generator script failed to load'));
          }
        };
        certScript.onerror = () => reject(new Error('Failed to load franchise certificate generator script'));
        document.body.appendChild(certScript);
      };
      jspdfScript.onerror = () => reject(new Error('Failed to load jspdf script'));
      document.body.appendChild(jspdfScript);
    } else if (!window.FranchiseCertificateGenerator) {
      // jspdf loaded but franchise-certificate-generator not loaded
      const certScript = document.createElement('script');
      certScript.src = '/franchise-certificate-generator.js';
      certScript.onload = async () => {
        if (window.FranchiseCertificateGenerator) {
          franchiseCertificateGenerator = window.FranchiseCertificateGenerator;
          try {
            await franchiseCertificateGenerator.loadTemplate('/franchise-certificate-template.jpeg');
            console.log('Franchise certificate template loaded successfully');
            resolve(franchiseCertificateGenerator);
          } catch (err) {
            console.error('CRITICAL ERROR: Franchise certificate template not found:', err.message);
            reject(new Error(`Template required: ${err.message}`));
          }
        } else {
          reject(new Error('Franchise certificate generator script failed to load'));
        }
      };
      certScript.onerror = () => reject(new Error('Failed to load franchise certificate generator script'));
      document.body.appendChild(certScript);
    }
  });
};

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-IN');
}

function FranchiseCertificateModal({ show, onClose, onSaved, initial }) {
  const [franchiseName, setFranchiseName] = useState('');
  const [address, setAddress] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [atcCode, setAtcCode] = useState('');
  const [dateOfIssue, setDateOfIssue] = useState('');
  const [dateOfRenewal, setDateOfRenewal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;

    setError('');
    setSaving(false);

    if (initial) {
      setFranchiseName(initial.franchiseName || '');
      setAddress(initial.address || '');
      setApplicantName(initial.applicantName || '');
      setAtcCode(initial.atcCode || '');
      setDateOfIssue(
        initial.dateOfIssue
          ? new Date(initial.dateOfIssue).toISOString().slice(0, 10)
          : ''
      );
      setDateOfRenewal(
        initial.dateOfRenewal
          ? new Date(initial.dateOfRenewal).toISOString().slice(0, 10)
          : ''
      );
    } else {
      setFranchiseName('');
      setAddress('');
      setApplicantName('');
      setAtcCode('');
      setDateOfIssue('');
      setDateOfRenewal('');
    }
  }, [show, initial]);

  if (!show) return null;

  const validate = () => {
    if (!franchiseName.trim()) {
      setError('Franchise Name is required.');
      return false;
    }
    if (!address.trim()) {
      setError('Address is required.');
      return false;
    }
    if (!applicantName.trim()) {
      setError('Applicant Name is required.');
      return false;
    }
    if (!atcCode.trim()) {
      setError('ATC Code is required.');
      return false;
    }
    if (!dateOfIssue) {
      setError('Date of Issue is required.');
      return false;
    }
    if (!dateOfRenewal) {
      setError('Date of Renewal is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSaving(true);

    try {
      // Generate certificate image data URL for storing
      let certificateImage = null;
      try {
        await initFranchiseCertificateGenerator();
      } catch (genErr) {
        setError(`Certificate generation failed: ${genErr.message}`);
        return;
      }

      if (franchiseCertificateGenerator) {
        try {
          const certificateData = {
            franchiseName: franchiseName.trim(),
            address: address.trim(),
            applicantName: applicantName.trim(),
            atcCode: atcCode.trim(),
            dateOfIssue: dateOfIssue,
            dateOfRenewal: dateOfRenewal,
          };
          certificateImage = await franchiseCertificateGenerator.getDataURL(certificateData);
        } catch (imgErr) {
          console.error('Could not generate franchise certificate image:', imgErr);
          setError('Failed to generate certificate image. Please ensure the JPG template is properly configured.');
          return;
        }
      } else {
        setError('Certificate generator not available. Please refresh the page.');
        return;
      }

      const payload = {
        franchiseName: franchiseName.trim(),
        address: address.trim(),
        applicantName: applicantName.trim(),
        atcCode: atcCode.trim(),
        dateOfIssue,
        dateOfRenewal,
        certificateImage,
      };

      let saved;
      if (initial && (initial._id || initial.id)) {
        const id = initial._id || initial.id;
        saved = await API.unwrap(API.put(`/franchise-certificates/${id}`, payload));
      } else {
        saved = await API.unwrap(API.post('/franchise-certificates', payload));
      }

      onSaved(saved);
    } catch (err) {
      console.error('save franchise certificate error:', err);
      setError(err.userMessage || 'Failed to save franchise certificate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">
                {initial ? 'Edit Franchise Certificate' : 'Create Franchise Certificate'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={saving}
              />
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Franchise Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={franchiseName}
                    onChange={(e) => setFranchiseName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Applicant Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Address *</label>
                  <textarea
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows="3"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">ATC Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={atcCode}
                    onChange={(e) => setAtcCode(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Date of Issue *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateOfIssue}
                    onChange={(e) => setDateOfIssue(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Date of Renewal *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateOfRenewal}
                    onChange={(e) => setDateOfRenewal(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
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
  );
}

// Franchise Certificate View Modal for printing
function FranchiseCertificateViewModal({ show, onClose, certificate }) {
  if (!show || !certificate) return null;

  const handlePrint = () => {
    // If we have a certificate image, open it in new window for printing
    if (certificate.certificateImage) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Franchise Certificate - ${certificate.atcCode}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { margin: 0; padding: 0; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <img src="${certificate.certificateImage}" />
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // Fallback to original HTML certificate
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Franchise Certificate - ${certificate.atcCode}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; padding: 20px; }
              .certificate {
                border: 5px double #1a365d;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                text-align: center;
                background: #fff;
              }
              .certificate h1 {
                font-size: 32px;
                color: #1a365d;
                margin-bottom: 10px;
                text-transform: uppercase;
              }
              .certificate h2 {
                font-size: 24px;
                color: #2d3748;
                margin: 20px 0;
                font-weight: normal;
              }
              .certificate .content {
                font-size: 16px;
                line-height: 2;
                color: #2d3748;
              }
              .certificate .name {
                font-size: 28px;
                font-weight: bold;
                color: #1a365d;
                margin: 20px 0;
                text-decoration: underline;
              }
              .certificate .details {
                margin: 30px 0;
              }
              .certificate .details table {
                width: 100%;
                border-collapse: collapse;
              }
              .certificate .details td {
                padding: 8px;
                text-align: left;
              }
              .certificate .details td:first-child {
                font-weight: bold;
                width: 40%;
              }
              @media print {
                body { padding: 0; }
                .certificate { border: none; }
              }
            </style>
          </head>
          <body>
            <div id="certificate-print">
              <div class="certificate">
                <h1>Franchise Certificate</h1>
                <div class="content">This is to certify that</div>

                <div class="name">${certificate.franchiseName}</div>

                <div class="content">
                  has been authorized as a franchise center with the following details:
                </div>

                <div class="details">
                  <table>
                    <tbody>
                      <tr>
                        <td>Applicant Name:</td>
                        <td>${certificate.applicantName}</td>
                      </tr>
                      <tr>
                        <td>Address:</td>
                        <td>${certificate.address}</td>
                      </tr>
                      <tr>
                        <td>ATC Code:</td>
                        <td>${certificate.atcCode}</td>
                      </tr>
                      <tr>
                        <td>Date of Issue:</td>
                        <td>${fmtDate(certificate.dateOfIssue)}</td>
                      </tr>
                      <tr>
                        <td>Date of Renewal:</td>
                        <td>${fmtDate(certificate.dateOfRenewal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = async () => {
    // Try to use template generator first
    if (window.FranchiseCertificateGenerator) {
      try {
        await window.FranchiseCertificateGenerator.loadTemplate('/franchise-certificate-template.jpeg');
        await window.FranchiseCertificateGenerator.download({
          trainingCentreName: certificate.franchiseName || certificate.applicantName,
          applicantName: certificate.applicantName,
          atcCode: certificate.atcCode,
          atcCode2: certificate.atcCode,
          dateOfIssue: certificate.dateOfIssue,
          dateOfRenewal: certificate.dateOfRenewal,
        });
        return;
      } catch (err) {
        console.error('Template generation failed:', err);
      }
    }

    // Fallback to stored image
    if (certificate.certificateImage) {
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => downloadAsPDF();
        document.body.appendChild(script);
      } else {
        downloadAsPDF();
      }
    } else {
      alert('No certificate image available to download');
    }
  };

  const downloadAsPDF = async () => {
    try {
      const { jsPDF } = window.jspdf;

      // Load the certificate image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = certificate.certificateImage;
      });

      // Create PDF with same dimensions as the image
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });

      // Add the image to PDF
      pdf.addImage(certificate.certificateImage, 'JPEG', 0, 0, img.width, img.height);

      // Download as PDF
      pdf.save(`franchise_certificate_${certificate.atcCode}.pdf`);
    } catch (err) {
      console.error('Error creating PDF:', err);
      alert('Failed to create PDF');
    }
  };

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div className="modal-dialog modal-xl" role="document" style={{ maxWidth: '90%' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">View Franchise Certificate - {certificate.atcCode}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            />
          </div>
          <div className="modal-body">
            <div className="text-center mb-3">
              <button className="btn btn-primary me-2" onClick={handlePrint}>
                Print Certificate
              </button>
              {certificate.certificateImage && (
                <button className="btn btn-success" onClick={handleDownload}>
                  Download Certificate
                </button>
              )}
            </div>
            {certificate.certificateImage ? (
              <div className="text-center">
                <img
                  src={certificate.certificateImage}
                  alt="Franchise Certificate"
                  style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc' }}
                />
              </div>
            ) : (
              <div id="certificate-print" className="certificate-preview p-4 border">
                <div className="text-center">
                  <h5 className="text-uppercase fw-bold">Franchise Certificate</h5>
                  <p className="text-muted">This is to certify that</p>
                  <h4 className="fw-bold text-primary mb-3">{certificate.franchiseName}</h4>
                  <p className="mb-2">has been authorized as a franchise center</p>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <p><strong>Applicant Name:</strong> {certificate.applicantName}</p>
                    <p><strong>Address:</strong> {certificate.address}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>ATC Code:</strong> {certificate.atcCode}</p>
                    <p><strong>Date of Issue:</strong> {fmtDate(certificate.dateOfIssue)}</p>
                    <p><strong>Date of Renewal:</strong> {fmtDate(certificate.dateOfRenewal)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FranchiseCertificateList({ createMode }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCert, setViewingCert] = useState(null);
  const [editing, setEditing] = useState(null);

  // Open create modal if in createMode
  useEffect(() => {
    if (createMode) {
      setShowModal(true);
    }
  }, [createMode]);

  const loadAll = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await API.unwrap(API.get('/franchise-certificates'));
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setCerts(arr);
    } catch (err) {
      console.error('fetch franchise certificates', err);
      setMsg(err.userMessage || 'Failed to load franchise certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredCerts = useMemo(() => {
    if (!search.trim()) return certs;
    const s = search.trim().toLowerCase();
    return certs.filter((c) =>
      (c.franchiseName || '').toLowerCase().includes(s) ||
      (c.applicantName || '').toLowerCase().includes(s) ||
      (c.atcCode || '').toLowerCase().includes(s)
    );
  }, [certs, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this franchise certificate?')) return;
    try {
      await API.delete(`/franchise-certificates/${id}`);
      setCerts((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setMsg('Franchise certificate deleted.');
    } catch (err) {
      console.error('delete franchise certificate error:', err);
      setMsg(err.userMessage || 'Failed to delete franchise certificate');
    }
  };

  const handleDownload = async (cert) => {
    try {
      // Initialize franchise certificate generator
      await initFranchiseCertificateGenerator();

      if (!franchiseCertificateGenerator) {
        alert('Certificate generator not available. Please try again.');
        return;
      }

      // Format certificate data for generator
      const certificateData = {
        trainingCentreName: cert.franchiseName,
        applicantName: cert.applicantName,
        atcCode: cert.atcCode,
        atcCode2: cert.atcCode, // Same ATC code printed twice
        dateOfIssue: cert.dateOfIssue,
        dateOfRenewal: cert.dateOfRenewal,
      };

      // Download the certificate
      await franchiseCertificateGenerator.download(certificateData);
    } catch (err) {
      console.error('Download certificate error:', err);
      alert('Failed to download certificate: ' + err.message);
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
      const idx = prev.findIndex(
        (c) => (c._id || c.id) === (saved._id || saved.id)
      );
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
              <h2 className="mb-0">Franchise Certificates</h2>
              <div className="small text-muted">
                View, search, edit and delete franchise certificates
              </div>
            </div>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: 260 }}
                placeholder="Search franchise certificates..."
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
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditing(null);
                  setShowModal(true);
                }}
              >
                Create Certificate
              </button>
            </div>
          </div>

          {msg && <div className="alert alert-info">{msg}</div>}

          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center text-muted">
                  Loading franchise certificates…
                </div>
              ) : filteredCerts.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No franchise certificates found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Franchise Name</th>
                        <th>Applicant Name</th>
                        <th>ATC Code</th>
                        <th>Address</th>
                        <th>Date of Issue</th>
                        <th>Date of Renewal</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCerts.map((c) => (
                        <tr key={c._id || c.id}>
                          <td>{c.franchiseName}</td>
                          <td>{c.applicantName}</td>
                          <td>{c.atcCode}</td>
                          <td>{c.address}</td>
                          <td>{fmtDate(c.dateOfIssue)}</td>
                          <td>{fmtDate(c.dateOfRenewal)}</td>
                           <td className="text-center">
                             <button
                               className="btn btn-sm btn-outline-success me-1"
                               onClick={() => handleView(c)}
                             >
                               View
                             </button>
                             <button
                               className="btn btn-sm btn-outline-primary me-1"
                               onClick={() => handleDownload(c)}
                             >
                               Download
                             </button>
                             <button
                               className="btn btn-sm btn-outline-warning me-1"
                               onClick={() => {
                                 setEditing(c);
                                 setShowModal(true);
                               }}
                             >
                               Edit
                             </button>
                             <button
                               className="btn btn-sm btn-outline-danger"
                               onClick={() =>
                                 handleDelete(c._id || c.id)
                               }
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
        </div>
      </div>

      <FranchiseCertificateModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing}
      />

      <FranchiseCertificateViewModal
        show={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingCert(null);
        }}
        certificate={viewingCert}
      />

      {/* Hidden canvas for franchise certificate rendering */}
      <canvas id="franchiseCertCanvas" style={{ display: 'none' }}></canvas>
    </div>
  );
}