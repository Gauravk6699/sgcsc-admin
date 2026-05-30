// src/pages/CertificateList.jsx
import { useEffect, useMemo, useState } from 'react';
import API from "../api/axiosInstance";

// Certificate Generator Global Reference
let certificateGenerator = null;

// Initialize Certificate Generator function
const initCertificateGenerator = async () => {
  if (certificateGenerator) return certificateGenerator;
  
  // Ensure canvas is available before loading template
  const canvasElement = document.getElementById('certCanvas');
  if (!canvasElement) {
    console.warn('Canvas element not found in DOM yet. Waiting...');
    // Wait for canvas to be available
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Check if already available on window
  if (window.CertificateGenerator) {
    certificateGenerator = window.CertificateGenerator;
    try {
      await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
      console.log('Certificate template loaded successfully');
      return certificateGenerator;
    } catch (err) {
      console.warn('Certificate template not found. Please upload a template to /public/student-certificate-template.jpeg');
      return certificateGenerator;
    }
  }
  
  // Script not loaded yet, dynamically load it
  return new Promise((resolve) => {
    // Load jspdf if not present
    if (!window.jspdf) {
      const jspdfScript = document.createElement('script');
      jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jspdfScript.onload = () => {
        // Load certificate-generator
        const certScript = document.createElement('script');
        certScript.src = '/certificate-generator.js';
        certScript.onload = async () => {
          if (window.CertificateGenerator) {
            certificateGenerator = window.CertificateGenerator;
            try {
              await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
              console.log('Certificate template loaded successfully');
            } catch (err) {
              console.warn('Certificate template not found. Please upload a template to /public/student-certificate-template.jpeg');
            }
          }
          resolve(certificateGenerator);
        };
        document.body.appendChild(certScript);
      };
      document.body.appendChild(jspdfScript);
    } else if (!window.CertificateGenerator) {
      // jspdf loaded but certificate-generator not loaded
      const certScript = document.createElement('script');
      certScript.src = '/certificate-generator.js';
      certScript.onload = async () => {
        if (window.CertificateGenerator) {
          certificateGenerator = window.CertificateGenerator;
          try {
            await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
            console.log('Certificate template loaded successfully');
          } catch (err) {
            console.warn('Certificate template not found. Please upload a template to /public/student-certificate-template.jpeg');
          }
        }
        resolve(certificateGenerator);
      };
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
      setIssueDate(
        initial.issueDate
          ? new Date(initial.issueDate).toISOString().slice(0, 10)
          : ''
      );
    } else {
      setName('');
      setFatherName('');
      setCourseName('');
      setSessionFrom('');
      setSessionTo('');
      setGrade('');
      setCourseDuration('');
      setCoursePeriodFrom('');
      setCoursePeriodTo('');
      setEnrollmentNumber('');
      setCertificateNumber('');
      setIssueDate('');
    }
  }, [show, initial]);

  if (!show) return null;

  const validate = () => {
    if (!name.trim()) {
      setError('Name is required.');
      return false;
    }
    if (!fatherName.trim()) {
      setError("Father's Name is required.");
      return false;
    }
    if (!courseName.trim()) {
      setError('Course Name is required.');
      return false;
    }
    if (!sessionFrom) {
      setError('Session From is required.');
      return false;
    }
    if (!sessionTo) {
      setError('Session To is required.');
      return false;
    }
    if (!grade.trim()) {
      setError('Grade is required.');
      return false;
    }
    if (!courseDuration.trim()) {
      setError('Course Duration is required.');
      return false;
    }
    if (!coursePeriodFrom) {
      setError('Course Period From is required.');
      return false;
    }
    if (!coursePeriodTo) {
      setError('Course Period To is required.');
      return false;
    }
    if (!enrollmentNumber.trim()) {
      setError('Enrollment Number is required.');
      return false;
    }
    if (!certificateNumber.trim()) {
      setError('Certificate Number is required.');
      return false;
    }
    if (!issueDate) {
      setError('Issue Date is required.');
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
      await initCertificateGenerator();
      if (certificateGenerator) {
        try {
          const studentNameCombined = fatherName 
            ? `${name} S/O, D/O, W/O ${fatherName}` 
            : name;
          
          // Try to get student photo from the enrollment number lookup
          let studentPhoto = '';
          try {
            const res = await API.get('/students');
            const allStudents = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
            const student = allStudents.find(s => 
              (s.enrollmentNumber || s.rollNumber || '').toLowerCase() === enrollmentNumber.trim().toLowerCase()
            );
            if (student && student.photo) {
              studentPhoto = student.photo;
            }
          } catch (lookupErr) {
            console.warn('Could not lookup student photo:', lookupErr);
          }
          
          const studentData = {
            atcCode: certificateNumber.trim(),
            studentNameCombined: studentNameCombined,
            courseName: courseName.trim(),
            grade: grade.trim(),
            courseDuration: courseDuration.trim(),
            coursePeriodFrom: coursePeriodFrom,
            coursePeriodTo: coursePeriodTo,
            certificateNumber: certificateNumber.trim(),
            dateOfIssue: issueDate,
            photo: studentPhoto
          };
          certificateImage = await certificateGenerator.getDataURL(studentData);
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
        coursePeriodFrom: coursePeriodFrom,
        coursePeriodTo: coursePeriodTo,
        enrollmentNumber: enrollmentNumber.trim(),
        certificateNumber: certificateNumber.trim(),
        issueDate,
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
                {initial ? 'Edit Certificate' : 'Create Certificate'}
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
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Father's Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Session From *</label>
                  <select
                    className="form-select"
                    value={sessionFrom}
                    onChange={(e) => setSessionFrom(e.target.value)}
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Session To *</label>
                  <select
                    className="form-select"
                    value={sessionTo}
                    onChange={(e) => setSessionTo(e.target.value)}
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Grade *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., A, A+, First Division"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Enrollment Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Certificate Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Issue Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
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

// Certificate View Modal for printing
function CertificateViewModal({ show, onClose, certificate }) {
  if (!show || !certificate) return null;

  const handlePrint = () => {
    // If we have a certificate image, open it in new window for printing
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
            <title>Certificate - ${certificate.certificateNumber}</title>
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
              .certificate .subtitle {
                font-size: 18px;
                color: #4a5568;
                margin-bottom: 30px;
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
              .certificate .footer {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
              }
              .certificate .signature {
                text-align: center;
                width: 200px;
              }
              .certificate .signature-line {
                border-top: 1px solid #000;
                margin-top: 50px;
                padding-top: 5px;
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
                <h1>Certificate of Completion</h1>
                <div class="subtitle">This is to certify that</div>
                
                <div class="name">${certificate.name}</div>
                
                <div class="content">
                  Son/Daughter of <strong>${certificate.fatherName}</strong>
                  <br /><br />
                  has successfully completed the course
                </div>
                
                <h2>${certificate.courseName}</h2>
                
                <div class="details">
                  <table>
                    <tbody>
                      <tr>
                        <td>Session:</td>
                        <td>${certificate.sessionFrom} - ${certificate.sessionTo}</td>
                      </tr>
                      <tr>
                        <td>Grade:</td>
                        <td>${certificate.grade}</td>
                      </tr>
                      <tr>
                        <td>Enrollment Number:</td>
                        <td>${certificate.enrollmentNumber}</td>
                      </tr>
                      <tr>
                        <td>Certificate Number:</td>
                        <td>${certificate.certificateNumber}</td>
                      </tr>
                      <tr>
                        <td>Issue Date:</td>
                        <td>${fmtDate(certificate.issueDate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div class="footer">
                  <div class="signature">
                    <div class="signature-line">Director</div>
                  </div>
                  <div class="signature">
                    <div class="signature-line">Principal</div>
                  </div>
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

  const handleDownload = () => {
    if (certificate.certificateImage) {
      // Load jsPDF if not already loaded
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
      pdf.save(`certificate_${certificate.certificateNumber}.pdf`);
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
            <h5 className="modal-title">View Certificate - {certificate.certificateNumber}</h5>
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
                  alt="Certificate" 
                  style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc' }}
                />
              </div>
            ) : (
              <div id="certificate-print" className="certificate-preview p-4 border">
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
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setCerts(arr);
    } catch (err) {
      console.error('fetch certificates', err);
      setMsg(err.userMessage || 'Failed to load certificates');
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
              <h2 className="mb-0">Student Certificates</h2>
              <div className="small text-muted">
                View, search, edit and delete certificates
              </div>
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
              <button
                className="btn btn-outline-secondary"
                onClick={loadAll}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {msg && <div className="alert alert-info">{msg}</div>}

          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center text-muted">
                  Loading certificates…
                </div>
              ) : filteredCerts.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No certificates found.
                </div>
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
                            <button
                              className="btn btn-sm btn-outline-success me-2"
                              onClick={() => handleView(c)}
                            >
                              View
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

      <CertificateModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing}
      />

      <CertificateViewModal
        show={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingCert(null);
        }}
        certificate={viewingCert}
      />

      {/* Hidden canvas for certificate rendering */}
      <canvas id="certCanvas" style={{ display: 'none' }}></canvas>
    </div>
  );
}
