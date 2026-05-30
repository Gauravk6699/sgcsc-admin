// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  // prefer admin-specific token key
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const fallbackToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const token = adminToken || fallbackToken;
  const location = useLocation();

  // if no token, redirect to login and remember where we were going
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optionally, you can also require admin_user to be present to render immediately:
  // const adminUser = localStorage.getItem('admin_user') || localStorage.getItem('user');
  // if (!adminUser) { /* optionally trigger a background /auth/me call or allow render anyway */ }

  return children;
}
