// src/pages/StudentResultVerification.jsx
import { useState } from 'react';
import API from '../api/axiosInstance';

export default function StudentResultVerification() {
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await API.post('/public/verify/result', { rollNumber, dob });
      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError('Result not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = (result) => {
    // Assuming result has a download URL or PDF generation
    // For now, just log or open in new tab
    window.open(`/api/results/download/${result._id}`, '_blank');
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Result Verification</h4>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Enter your roll number and date of birth to verify and download your result
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
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Result'}
                </button>
              </form>

              {results && results.length > 0 && (
                <div className="mt-4">
                  <h5>Your Results:</h5>
                  {results.map((result, index) => (
                    <div key={index} className="border p-3 mb-3 rounded">
                      <p><strong>Course:</strong> {result.courseName || 'N/A'}</p>
                      <p><strong>Percentage:</strong> {result.percentage || 'N/A'}%</p>
                      <p><strong>Grade:</strong> {result.overallGrade || 'N/A'}</p>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => downloadResult(result)}
                      >
                        Download Result
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