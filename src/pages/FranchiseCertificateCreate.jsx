// src/pages/FranchiseCertificateCreate.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../api/axiosInstance";

// Franchise Certificate Generator Global Reference
let franchiseCertificateGenerator = null;

// Initialize Franchise Certificate Generator function
const initFranchiseCertificateGenerator = async () => {
  if (franchiseCertificateGenerator) return franchiseCertificateGenerator;

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

export default function FranchiseCertificateCreate() {
  // Form fields for franchise certificate
  const [franchiseName, setFranchiseName] = useState('');
  const [address, setAddress] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [atcCode, setAtcCode] = useState('');
  const [dateOfIssue, setDateOfIssue] = useState('');
  const [dateOfRenewal, setDateOfRenewal] = useState('');

  const [franchises, setFranchises] = useState([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const navigate = useNavigate();

  // Load franchises once, so picking one can auto-fill the form below.
  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const res = await API.get('/franchises');
        const data = res.data;
        const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setFranchises(arr);
      } catch (err) {
        console.error('Failed to load franchises:', err);
      }
    };
    fetchFranchises();
  }, []);

  // ATC Code must match the franchise's Institute ID so the public
  // verification page can look up this certificate later.
  const handleSelectFranchise = (id) => {
    setSelectedFranchiseId(id);
    if (!id) return;
    const f = franchises.find((x) => (x._id || x.id) === id);
    if (!f) return;
    setFranchiseName(f.instituteName || '');
    setAddress(f.address || '');
    setApplicantName(f.ownerName || '');
    setAtcCode(f.instituteId || '');
  };

  const validate = () => {
    if (!franchiseName.trim()) {
      setMessageType('danger');
      setMessage('Franchise Name is required.');
      return false;
    }
    if (!address.trim()) {
      setMessageType('danger');
      setMessage('Address is required.');
      return false;
    }
    if (!applicantName.trim()) {
      setMessageType('danger');
      setMessage('Applicant Name is required.');
      return false;
    }
    if (!atcCode.trim()) {
      setMessageType('danger');
      setMessage('ATC Code is required.');
      return false;
    }
    if (!dateOfIssue) {
      setMessageType('danger');
      setMessage('Date of Issue is required.');
      return false;
    }
    if (!dateOfRenewal) {
      setMessageType('danger');
      setMessage('Date of Renewal is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validate()) return;

    setSaving(true);

    try {
      // Generate certificate image data URL for storing
      let certificateImage = null;
      try {
        await initFranchiseCertificateGenerator();
      } catch (genErr) {
        setMessageType('danger');
        setMessage(`Certificate generation failed: ${genErr.message}`);
        return;
      }

      if (franchiseCertificateGenerator) {
        try {
          const certificateData = {
            trainingCentreName: franchiseName.trim(),
            address: address.trim(),
            applicantName: applicantName.trim(),
            atcCode: atcCode.trim(),
            atcCode2: atcCode.trim(), // Same ATC code printed twice
            dateOfIssue: dateOfIssue,
            dateOfRenewal: dateOfRenewal,
          };
          certificateImage = await franchiseCertificateGenerator.getDataURL(certificateData);
        } catch (imgErr) {
          console.error('Could not generate franchise certificate image:', imgErr);
          setMessageType('danger');
          setMessage('Failed to generate certificate image. Please ensure the JPG template is properly configured.');
          return;
        }
      } else {
        setMessageType('danger');
        setMessage('Certificate generator not available.');
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

      await API.unwrap(API.post('/franchise-certificates', payload));

      setMessageType('success');
      setMessage('Franchise certificate created successfully!');

      setTimeout(() => navigate('/franchise-certificates'), 500);

      // Reset form
      setFranchiseName('');
      setAddress('');
      setApplicantName('');
      setAtcCode('');
      setDateOfIssue('');
      setDateOfRenewal('');
      setSelectedFranchiseId('');
    } catch (err) {
      console.error('create franchise certificate error:', err);
      setMessageType('danger');
      setMessage(err.userMessage || err.response?.data?.message || 'Failed to create franchise certificate. Please check all fields are filled correctly.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-4 fw-bold">Generate Franchise Certificate</h2>

          {message && (
            <div
              className={`alert alert-${messageType === 'danger' ? 'danger' : messageType === 'success' ? 'success' : 'info'}`}
              role="alert"
            >
              {message}
            </div>
          )}

          <div className="card shadow-sm" style={{ maxWidth: 1000 }}>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                {/* Auto-fill from existing franchise */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Select Franchise (auto-fills details below)</label>
                  <select
                    className="form-select"
                    value={selectedFranchiseId}
                    onChange={(e) => handleSelectFranchise(e.target.value)}
                  >
                    <option value="">— Choose a franchise —</option>
                    {franchises.map((f) => {
                      const fid = f._id || f.id;
                      return (
                        <option key={fid} value={fid}>
                          {f.instituteName} — {f.instituteId} ({f.status || 'pending'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Franchise Details */}
                <div className="col-12">
                  <h5 className="mb-3 text-primary">Franchise Details</h5>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Franchise Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={franchiseName}
                    onChange={(e) => setFranchiseName(e.target.value)}
                    placeholder="Enter franchise name"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Address *</label>
                  <textarea
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter franchise address"
                    rows="3"
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
                    placeholder="Enter applicant name"
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
                    placeholder="Enter ATC code"
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

                <div className="col-12 mt-4">
                  <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                    {saving ? 'Generating Franchise Certificate...' : 'Generate Franchise Certificate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}