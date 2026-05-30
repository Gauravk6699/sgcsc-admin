import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from "../api/axiosInstance";

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const id = searchParams.get('id');

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await API.post('/auth/reset-password', { userId: id, token, password });
      setSuccess('Password reset successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #dbeafe, #e9d5ff)' }}>
      <div className="card shadow-lg p-4" style={{ width: '400px', borderRadius: '1rem' }}>
        <div className="text-center mb-4">
          <div className="rounded-circle bg-gradient text-white d-flex justify-content-center align-items-center mx-auto" style={{ width: '60px', height: '60px', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', fontSize: '1.5rem', fontWeight: '700' }}>
            🔒
          </div>
          <h3 className="mt-3">Reset Password</h3>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleReset}>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2">
            Reset Password
          </button>
        </form>

        <div className="text-center mt-3">
          <button className="btn btn-link p-0" onClick={() => navigate('/')}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
