// src/pages/TypingCertificateList.jsx
import { useEffect, useMemo, useState } from 'react';
import API from "../api/axiosInstance";

// Typing Certificate Generator Global Reference
let typingCertificateGenerator = null;

// Initialize Typing Certificate Generator function
const initTypingCertificateGenerator = async () => {
  if (typingCertificateGenerator) return typingCertificateGenerator;

  // Ensure canvas is available before loading template
  const canvasElement = document.getElementById('typingCertCanvas');
  if (!canvasElement) {
    console.warn('Canvas element not found in DOM yet. Waiting...');
    // Wait for canvas to be available
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Helper to load template and fetch config
  const loadTemplateAndConfig = async (generator) => {
    typingCertificateGenerator = generator;
    // First, fetch config from API which may include templatePath
    try {
      await generator.fetchConfigFromAPI();
    } catch (apiErr) {
      console.warn('API config fetch failed, using defaults:', apiErr);
    }
    // Load template — use API-configured path or fall back to default
    const templatePath = generator.CONFIG?.templatePath || '/typing-certificate-template.jpeg';
    await generator.loadTemplate(templatePath);
    console.log('Typing certificate template loaded successfully from:', templatePath);
    return generator;
  };

  // Check if already available on window
  if (window.TypingCertificateGenerator) {
    try {
      return await loadTemplateAndConfig(window.TypingCertificateGenerator);
    } catch (err) {
      console.error('CRITICAL ERROR: Typing certificate template not found:', err.message);
      console.error('Please upload typing-certificate-template.jpeg to the public folder');
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
        // Load typing-certificate-generator
        const certScript = document.createElement('script');
        certScript.src = '/typing-certificate-generator.js';
        certScript.onload = async () => {
          if (window.TypingCertificateGenerator) {
            try {
              const generator = await loadTemplateAndConfig(window.TypingCertificateGenerator);
              resolve(generator);
            } catch (err) {
              console.error('CRITICAL ERROR: Typing certificate template not found:', err.message);
              reject(new Error(`Template required: ${err.message}`));
            }
          } else {
            reject(new Error('Typing certificate generator script failed to load'));
          }
        };
        certScript.onerror = () => reject(new Error('Failed to load typing certificate generator script'));
        document.body.appendChild(certScript);
      };
      jspdfScript.onerror = () => reject(new Error('Failed to load jspdf script'));
      document.body.appendChild(jspdfScript);
    } else if (!window.TypingCertificateGenerator) {
      // jspdf loaded but typing-certificate-generator not loaded
      const certScript = document.createElement('script');
      certScript.src = '/typing-certificate-generator.js';
      certScript.onload = async () => {
        if (window.TypingCertificateGenerator) {
          try {
            const generator = await loadTemplateAndConfig(window.TypingCertificateGenerator);
            resolve(generator);
          } catch (err) {
            console.error('CRITICAL ERROR: Typing certificate template not found:', err.message);
            reject(new Error(`Template required: ${err.message}`));
          }
        } else {
          reject(new Error('Typing certificate generator script failed to load'));
        }
      };
      certScript.onerror = () => reject(new Error('Failed to load typing certificate generator script'));
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

function TypingCertificateModal({ show, onClose, onSaved, initial }) {
  const [studentName, setStudentName] = useState('');
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [computerTyping, setComputerTyping] = useState('');
  const [certificateNo, setCertificateNo] = useState('');
  const [dateOfIssue, setDateOfIssue] = useState('');
  const [sessionFrom, setSessionFrom] = useState('');
  const [sessionTo, setSessionTo] = useState('');
  const [grade, setGrade] = useState('');
  const [studyCentre, setStudyCentre] = useState('');
  const [wordsPerMinute, setWordsPerMinute] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    if (!show) return;

    setError('');
    setSaving(false);
    setStudentId('');

    API.unwrap(API.get('/students'))
      .then((data) => {
        const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setStudents(arr);
      })
      .catch((err) => console.error('load students error (typing certificate):', err));

    if (initial) {
      setStudentName(initial.studentName || '');
      setFatherHusbandName(initial.fatherHusbandName || '');
      setMotherName(initial.motherName || '');
      setEnrollmentNumber(initial.enrollmentNumber || '');
      setComputerTyping(initial.computerTyping || '');
      setCertificateNo(initial.certificateNo || '');
      setDateOfIssue(
        initial.dateOfIssue
          ? new Date(initial.dateOfIssue).toISOString().slice(0, 10)
          : ''
      );
      setSessionFrom(initial.sessionFrom || '');
      setSessionTo(initial.sessionTo || '');
      setGrade(initial.grade || '');
      setStudyCentre(initial.studyCentre || '');
      setWordsPerMinute(initial.wordsPerMinute || '');
    } else {
      setStudentName('');
      setFatherHusbandName('');
      setMotherName('');
      setEnrollmentNumber('');
      setComputerTyping('');
      setCertificateNo('');
      setDateOfIssue('');
      setSessionFrom('');
      setSessionTo('');
      setGrade('');
      setStudyCentre('');
      setWordsPerMinute('');
    }
  }, [show, initial]);

  const applyStudentFields = (student) => {
    if (!student) return;
    if (student.name) setStudentName(student.name);
    if (student.fatherName) setFatherHusbandName(student.fatherName);
    if (student.motherName) setMotherName(student.motherName);
    setEnrollmentNumber(student.enrollmentNo || student.rollNumber || '');
    const c0 = student.courses?.[0];
    const sStart = student.sessionStart || c0?.sessionStart;
    const sEnd = student.sessionEnd || c0?.sessionEnd;
    if (sStart) setSessionFrom(new Date(sStart).getFullYear().toString());
    if (sEnd) setSessionTo(new Date(sEnd).getFullYear().toString());
  };

  const handleSelectStudent = (e) => {
    const id = e.target.value;
    setStudentId(id);
    if (id) {
      const student = students.find((s) => (s._id || s.id) === id);
      applyStudentFields(student);
    }
  };

  const handleLookupStudent = () => {
    const q = enrollmentNumber.trim().toLowerCase();
    if (!q) {
      setError('Enter an enrollment/roll number to look up.');
      return;
    }
    const student = students.find(
      (s) =>
        (s.enrollmentNo || '').toLowerCase() === q ||
        (s.rollNumber || '').toLowerCase() === q
    );
    if (!student) {
      setError('No student found with that enrollment/roll number.');
      return;
    }
    setError('');
    setStudentId(student._id || student.id || '');
    applyStudentFields(student);
  };

  if (!show) return null;

  const validate = () => {
    if (!studentName.trim()) {
      setError('Student Name is required.');
      return false;
    }
    if (!fatherHusbandName.trim()) {
      setError('Father/Husband Name is required.');
      return false;
    }
    if (!motherName.trim()) {
      setError('Mother Name is required.');
      return false;
    }
    if (!enrollmentNumber.trim()) {
      setError('Enrollment Number is required.');
      return false;
    }
    if (!computerTyping.trim()) {
      setError('Computer Typing is required.');
      return false;
    }
    if (!certificateNo.trim()) {
      setError('Certificate Number is required.');
      return false;
    }
    if (!dateOfIssue) {
      setError('Date of Issue is required.');
      return false;
    }
    if (!sessionFrom.trim()) {
      setError('Session From is required.');
      return false;
    }
    if (!sessionTo.trim()) {
      setError('Session To is required.');
      return false;
    }
    if (!grade.trim()) {
      setError('Grade is required.');
      return false;
    }
    if (!studyCentre.trim()) {
      setError('Study Centre is required.');
      return false;
    }
    if (!wordsPerMinute.trim()) {
      setError('Words Per Minute is required.');
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
        await initTypingCertificateGenerator();
      } catch (genErr) {
        setError(`Certificate generation failed: ${genErr.message}`);
        return;
      }

      if (typingCertificateGenerator) {
        try {
          const certificateData = {
            studentName: studentName.trim(),
            fatherHusbandName: fatherHusbandName.trim(),
            motherName: motherName.trim(),
            enrollmentNumber: enrollmentNumber.trim(),
            computerTyping: computerTyping.trim(),
            certificateNo: certificateNo.trim(),
            dateOfIssue: dateOfIssue,
            sessionFrom: sessionFrom.trim(),
            sessionTo: sessionTo.trim(),
            grade: grade.trim(),
            studyCentre: studyCentre.trim(),
            wordsPerMinute: wordsPerMinute.trim(),
          };
          certificateImage = await typingCertificateGenerator.getDataURL(certificateData);
        } catch (imgErr) {
          console.error('Could not generate typing certificate image:', imgErr);
          setError('Failed to generate certificate image. Please ensure the JPG template is properly configured.');
          return;
        }
      } else {
        setError('Certificate generator not available. Please refresh the page.');
        return;
      }

      const payload = {
        studentName: studentName.trim(),
        fatherHusbandName: fatherHusbandName.trim(),
        motherName: motherName.trim(),
        enrollmentNumber: enrollmentNumber.trim(),
        computerTyping: computerTyping.trim(),
        certificateNo: certificateNo.trim(),
        dateOfIssue,
        sessionFrom: sessionFrom.trim(),
        sessionTo: sessionTo.trim(),
        grade: grade.trim(),
        studyCentre: studyCentre.trim(),
        wordsPerMinute: wordsPerMinute.trim(),
        certificateImage,
      };

      let saved;
      if (initial && (initial._id || initial.id)) {
        const id = initial._id || initial.id;
        saved = await API.unwrap(API.put(`/typing-certificates/${id}`, payload));
      } else {
        saved = await API.unwrap(API.post('/typing-certificates', payload));
      }

      onSaved(saved);
    } catch (err) {
      console.error('save typing certificate error:', err);
      setError(err.userMessage || 'Failed to save typing certificate');
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
                {initial ? 'Edit Typing Certificate' : 'Create Typing Certificate'}
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
                  <label className="form-label">
                    Select Student (optional - auto-fills details)
                  </label>
                  <select
                    className="form-select"
                    value={studentId}
                    onChange={handleSelectStudent}
                  >
                    <option value="">Select a student</option>
                    {students.map((s) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.name || s.fullName || 'Student'}{' '}
                        {s.rollNumber ? `(${s.rollNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={handleLookupStudent}
                  >
                    Look up by Enrollment Number
                  </button>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Student Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Father/Husband Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fatherHusbandName}
                    onChange={(e) => setFatherHusbandName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Mother Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
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
                  <label className="form-label">Computer Typing *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={computerTyping}
                    onChange={(e) => setComputerTyping(e.target.value)}
                    placeholder="e.g., English/Hindi Typing"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Certificate Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={certificateNo}
                    onChange={(e) => setCertificateNo(e.target.value)}
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
                  <label className="form-label">Session From *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sessionFrom}
                    onChange={(e) => setSessionFrom(e.target.value)}
                    placeholder="e.g., 2020"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Session To *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sessionTo}
                    onChange={(e) => setSessionTo(e.target.value)}
                    placeholder="e.g., 2021"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Grade *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., A+"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Study Centre *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={studyCentre}
                    onChange={(e) => setStudyCentre(e.target.value)}
                    placeholder="e.g., xyz"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Words Per Minute *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={wordsPerMinute}
                    onChange={(e) => setWordsPerMinute(e.target.value)}
                    placeholder="e.g., 50"
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

// Typing Certificate View Modal for printing
function TypingCertificateViewModal({ show, onClose, certificate }) {
  if (!show || !certificate) return null;

  const handlePrint = () => {
    // If we have a certificate image, open it in new window for printing
    if (certificate.certificateImage) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Typing Certificate - ${certificate.certificateNo}</title>
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
            <title>Typing Certificate - ${certificate.certificateNo}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; padding: 20px; }
              .certificate {
                border: 5px double #123a5e;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                text-align: center;
                background: #fff;
              }
              .certificate h1 {
                font-size: 32px;
                color: #123a5e;
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
                color: #123a5e;
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
                <h1>Typing Certificate</h1>
                <div class="content">This is to certify that</div>

                <div class="name">${certificate.studentName}</div>

                <div class="content">
                  has successfully completed computer typing training with the following details:
                </div>

                <div class="details">
                  <table>
                    <tbody>
                      <tr>
                        <td>Father/Husband Name:</td>
                        <td>${certificate.fatherHusbandName}</td>
                      </tr>
                      <tr>
                        <td>Mother Name:</td>
                        <td>${certificate.motherName}</td>
                      </tr>
                      <tr>
                        <td>Enrollment Number:</td>
                        <td>${certificate.enrollmentNumber}</td>
                      </tr>
                      <tr>
                        <td>Computer Typing:</td>
                        <td>${certificate.computerTyping}</td>
                      </tr>
                      <tr>
                        <td>Certificate Number:</td>
                        <td>${certificate.certificateNo}</td>
                      </tr>
                      <tr>
                        <td>Date of Issue:</td>
                        <td>${fmtDate(certificate.dateOfIssue)}</td>
                      </tr>
                      <tr>
                        <td>Session From:</td>
                        <td>${certificate.sessionFrom}</td>
                      </tr>
                      <tr>
                        <td>Session To:</td>
                        <td>${certificate.sessionTo}</td>
                      </tr>
                      <tr>
                        <td>Grade:</td>
                        <td>${certificate.grade}</td>
                      </tr>
                      <tr>
                        <td>Study Centre:</td>
                        <td>${certificate.studyCentre}</td>
                      </tr>
                      <tr>
                        <td>Words Per Minute:</td>
                        <td>${certificate.wordsPerMinute}</td>
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
      pdf.save(`typing_certificate_${certificate.certificateNo}.pdf`);
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
            <h5 className="modal-title">View Typing Certificate - {certificate.certificateNo}</h5>
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
                  alt="Typing Certificate"
                  style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc' }}
                />
              </div>
            ) : (
              <div id="certificate-print" className="certificate-preview p-4 border">
                <div className="text-center">
                  <h5 className="text-uppercase fw-bold">Typing Certificate</h5>
                  <p className="text-muted">This is to certify that</p>
                  <h4 className="fw-bold text-primary mb-3">{certificate.studentName}</h4>
                  <p className="mb-2">has successfully completed computer typing training</p>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <p><strong>Father/Husband Name:</strong> {certificate.fatherHusbandName}</p>
                    <p><strong>Mother Name:</strong> {certificate.motherName}</p>
                    <p><strong>Enrollment No:</strong> {certificate.enrollmentNumber}</p>
                    <p><strong>Session From:</strong> {certificate.sessionFrom}</p>
                    <p><strong>Session To:</strong> {certificate.sessionTo}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Computer Typing:</strong> {certificate.computerTyping}</p>
                    <p><strong>Certificate No:</strong> {certificate.certificateNo}</p>
                    <p><strong>Date of Issue:</strong> {fmtDate(certificate.dateOfIssue)}</p>
                    <p><strong>Grade:</strong> {certificate.grade}</p>
                    <p><strong>Study Centre:</strong> {certificate.studyCentre}</p>
                    <p><strong>Words Per Minute:</strong> {certificate.wordsPerMinute}</p>
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

export default function TypingCertificateList() {
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
      const data = await API.unwrap(API.get('/typing-certificates'));
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setCerts(arr);
    } catch (err) {
      console.error('fetch typing certificates', err);
      setMsg(err.userMessage || 'Failed to load typing certificates');
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
      (c.studentName || '').toLowerCase().includes(s) ||
      (c.enrollmentNumber || '').toLowerCase().includes(s) ||
      (c.certificateNo || '').toLowerCase().includes(s)
    );
  }, [certs, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this typing certificate?')) return;
    try {
      await API.delete(`/typing-certificates/${id}`);
      setCerts((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setMsg('Typing certificate deleted.');
    } catch (err) {
      console.error('delete typing certificate error:', err);
      setMsg(err.userMessage || 'Failed to delete typing certificate');
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
              <h2 className="mb-0">Typing Certificates</h2>
              <div className="small text-muted">
                View, search, edit and delete typing certificates
              </div>
            </div>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: 260 }}
                placeholder="Search typing certificates..."
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
                  Loading typing certificates…
                </div>
              ) : filteredCerts.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No typing certificates found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Student Name</th>
                        <th>Father/Husband Name</th>
                        <th>Enrollment No</th>
                        <th>Certificate No</th>
                        <th>Computer Typing</th>
                        <th>Session From</th>
                        <th>Grade</th>
                        <th>Date of Issue</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCerts.map((c) => (
                        <tr key={c._id || c.id}>
                          <td>{c.studentName}</td>
                          <td>{c.fatherHusbandName}</td>
                          <td>{c.enrollmentNumber}</td>
                          <td>{c.certificateNo}</td>
                          <td>{c.computerTyping}</td>
                          <td>{c.sessionFrom}</td>
                          <td>{c.grade}</td>
                          <td>{fmtDate(c.dateOfIssue)}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-success me-2"
                              onClick={() => handleView(c)}
                            >
                              View
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning me-2"
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

      <TypingCertificateModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing}
      />

      <TypingCertificateViewModal
        show={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingCert(null);
        }}
        certificate={viewingCert}
      />

      {/* Hidden canvas for typing certificate rendering */}
      <canvas id="typingCertCanvas" style={{ display: 'none' }}></canvas>
    </div>
  );
}