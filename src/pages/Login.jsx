// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.jpeg';

import api from '../api/axiosInstance'; 

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // POST to backend login
      const res = await api.post('/auth/admin-login', { username, password });
      // Possible shapes:
      // 1) res.data = { success:true, data: { token, user } }
      // 2) res.data = { token, user }
      // 3) res.data = { token }
      const payload = res?.data ?? {};
      const token =
        payload?.data?.token ?? payload?.token ?? payload?.accessToken ?? null;

      if (!token) {
        throw new Error('No token returned by server');
      }

      // Save admin token (primary) and fallback 'token'
      localStorage.setItem('admin_token', token);
      localStorage.setItem('token', token); // keep for code that expects 'token'

      // Prefer user returned in login response; if not present, do not call /auth/me here.
      const returnedUser = payload?.data?.user ?? payload?.user ?? null;
      if (returnedUser) {
        localStorage.setItem('admin_user', JSON.stringify(returnedUser));
        localStorage.setItem('user', JSON.stringify(returnedUser)); // fallback
      }

      if (onLogin) onLogin(token);

      // Navigate to dashboard (fast). If you later add /auth/me, you can call it in App init.
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-5" style={{ width: '380px', borderRadius: '1.5rem', border: 'none' }}>
        <div className="text-center mb-4">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: '70px', height: '70px', fontSize: '28px', fontWeight: 'bold', boxShadow: '0 6px 15px rgba(0,0,0,0.2)' }}
          >
            <img
              src={logo}
              alt="Admin Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
            />
          </div>
          <h3 className="fw-bold text-dark">Admin Login</h3>
        </div>

        {error && <div className="alert alert-danger text-center py-2">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label fw-semibold">Username</label>
            <input
              type="text"
              id="username"
              placeholder="sgcsc"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-control form-control-lg shadow-sm"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <input
              type="password"
              id="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control form-control-lg shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 btn-lg fw-bold shadow-sm"
            style={{ transition: 'all 0.2s', letterSpacing: '0.5px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: '0.9rem' }}>
          Forgot your password?{' '}
          <span
            onClick={() => navigate('/reset-password')}
            className="text-primary fw-bold"
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Reset it
          </span>
        </p> */}


      </div>
    </div>
  );
}
