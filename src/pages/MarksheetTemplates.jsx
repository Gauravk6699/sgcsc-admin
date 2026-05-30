// src/pages/MarksheetTemplates.jsx
import React, { useEffect, useState } from 'react';
import API from "../api/axiosInstance";

export default function MarksheetTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await API.unwrap(API.get('/marksheets/templates'));
        setTemplates(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="d-flex">
      <div className="flex-grow-1">
        <div className="p-4">
          <h2>Marksheet Templates</h2>
          <p className="text-muted">Create and manage PDF templates for marksheets</p>

          {loading ? (
            <div>Loading...</div>
          ) : templates.length === 0 ? (
            <div className="text-muted">No templates yet. Add one to generate marksheets.</div>
          ) : (
            <div className="row">
              {templates.map((t) => (
                <div key={t._id} className="col-md-4 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">{t.name}</h5>
                      <p className="card-text small text-muted">{(t.html || '').slice(0, 120)}...</p>
                      <div>
                        <button className="btn btn-sm btn-primary me-2">Edit</button>
                        <button className="btn btn-sm btn-danger">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
