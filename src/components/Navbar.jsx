import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

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
        <button
          type="button"
          className="btn btn-outline-light btn-sm me-3 d-md-none"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminSidebar"
          aria-controls="adminSidebar"
          aria-label="Toggle sidebar"
        >
          <FaBars />
        </button>
        <Link to="/dashboard" className="navbar-brand fw-bold text-white text-decoration-none">
          Admin Panel
        </Link>
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
