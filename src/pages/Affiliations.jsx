// src/pages/Affiliations.jsx
import React from 'react';
import UploadAffiliation from '../components/UploadAffiliation';

export default function Affiliations() {
  return (
    <div className="d-flex min-vh-100 bg-light">
      <Sidebar />
      <div className="flex-grow-1">
        <Navbar />
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">Affiliations</h2>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <UploadAffiliation />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
