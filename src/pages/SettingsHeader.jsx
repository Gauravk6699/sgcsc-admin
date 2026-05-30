// src/pages/SettingsHeader.jsx
import React from "react";

export default function SettingsHeader() {
  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-2 fw-bold">Settings – Header</h2>
          <p className="text-muted mb-0">
            Header settings will be configured here later.
          </p>

          <div className="card shadow-sm mt-3">
            <div className="card-body text-muted">
              <em>Placeholder:</em> This page is intentionally left minimal.
              You can add fields for top bar text, navigation items, contact info, etc. later.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
