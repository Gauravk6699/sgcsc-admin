import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Redirect to login page
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm px-4">
      <div className="container-fluid">
        <span className="navbar-brand fw-bold">Admin Panel</span>
        <div className="d-flex">
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
