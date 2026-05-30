// src/pages/StudentCertificateVerification.jsx
import { useState } from 'react';
import API from '../api/axiosInstance';

export default function StudentCertificateVerification() {
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCertificates(null);

    try {
      const response = await API.post('/public/verify/certificate', { rollNumber, dob });
      if (response.data.success) {
        setCertificates(response.data.data);
      } else {
        setError('Certificate not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (certificate) => {
    // Assuming certificate has a download URL
    window.open(`/api/certificates/download/${certificate._id}`, '_blank');
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-success text-white">
              <h4 className="mb-0">Certificate Verification</h4>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Enter your roll number and date of birth to verify and download your certificate
              </p>

              {error && (
                <div className="alert alert-danger">{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="rollNumber" className="form-label">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="rollNumber"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Enter your roll number"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="dob" className="form-label">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Certificate'}
                </button>
              </form>

              {certificates && certificates.length > 0 && (
                <div className="mt-4">
                  <h5>Your Certificates:</h5>
                  {certificates.map((certificate, index) => (
                    <div key={index} className="border p-3 mb-3 rounded">
                      <p><strong>Certificate Number:</strong> {certificate.certificateNumber || 'N/A'}</p>
                      <p><strong>Course:</strong> {certificate.courseName || 'N/A'}</p>
                      <p><strong>Issue Date:</strong> {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : 'N/A'}</p>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => downloadCertificate(certificate)}
                      >
                        Download Certificate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}