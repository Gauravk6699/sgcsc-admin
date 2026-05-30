// src/pages/SettingsFooter.jsx
import React from "react";

export default function SettingsFooter() {
  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-2 fw-bold">Settings – Footer</h2>
          <p className="text-muted mb-0">
            Footer settings will be configured here later.
          </p>

          <div className="card shadow-sm mt-3">
            <div className="card-body text-muted">
              <em>Placeholder:</em> This page is intentionally left minimal.
              Later you can manage footer text, address, contact info, and links here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
