// src/pages/SettingsCreditPricing.jsx
import React, { useState, useEffect } from "react";
import { getCreditSettings, updateCreditPricing } from "../api/api";

export default function SettingsCreditPricing() {
  const [pricing, setPricing] = useState({
    student: 10,
    course: 20,
    subject: 5,
    result: 15,
    certificate: 25,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch current pricing on mount
  useEffect(() => {
    fetchCreditSettings();
  }, []);

  const fetchCreditSettings = async () => {
    try {
      setFetching(true);
      const settings = await getCreditSettings();
      if (settings?.creditPricing) {
        setPricing(settings.creditPricing);
      }
    } catch (err) {
      console.error("Error fetching credit settings:", err);
      setMessage({ type: "error", text: "Failed to load credit pricing settings" });
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow only positive numbers
    const numValue = parseInt(value, 10);
    if (value === "" || (numValue >= 0 && !isNaN(numValue))) {
      setPricing((prev) => ({
        ...prev,
        [name]: value === "" ? "" : numValue,
      }));
    }
  };

  const validatePricing = () => {
    const fields = ["student", "course", "subject", "result", "certificate"];
    for (const field of fields) {
      const value = pricing[field];
      if (value === "" || value === undefined || value === null || value < 0) {
        return { valid: false, field };
      }
    }
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submitting
    const validation = validatePricing();
    if (!validation.valid) {
      setMessage({ 
        type: "error", 
        text: `Please enter a valid positive number for ${validation.field}` 
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Ensure all values are numbers
      const pricingData = {
        student: Number(pricing.student),
        course: Number(pricing.course),
        subject: Number(pricing.subject),
        result: Number(pricing.result),
        certificate: Number(pricing.certificate),
      };
      
      const res = await updateCreditPricing(pricingData);
      if (res?.success) {
        setMessage({ type: "success", text: "Credit pricing updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update credit pricing" });
      }
    } catch (err) {
      console.error("Error updating credit pricing:", err);
      setMessage({
        type: "error",
        text: err.userMessage || "Failed to update credit pricing",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-2 fw-bold">Credit Pricing Settings</h2>
          <p className="text-muted mb-4">
            Configure the credit cost for each feature. These credits will be deducted from franchise accounts when they perform these actions.
          </p>

          {/* Alert Message */}
          {message.text && (
            <div
              className={`alert alert-${
                message.type === "success" ? "success" : "danger"
              } alert-dismissible fade show`}
              role="alert"
            >
              {message.text}
              <button
                type="button"
                className="btn-close"
                onClick={() => setMessage({ type: "", text: "" })}
              ></button>
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-body">
              {fetching ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading credit pricing settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Add Student */}
                  <div className="mb-4">
                    <label htmlFor="student" className="form-label fw-semibold">
                      <i className="bi bi-person-plus me-2 text-primary"></i>
                      Add Student
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="student"
                        name="student"
                        value={pricing.student}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                      <span className="input-group-text">credits</span>
                    </div>
                    <small className="text-muted">
                      Credits deducted when adding a new student
                    </small>
                  </div>

                  {/* Create Course */}
                  <div className="mb-4">
                    <label htmlFor="course" className="form-label fw-semibold">
                      <i className="bi bi-book me-2 text-success"></i>
                      Create Course
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="course"
                        name="course"
                        value={pricing.course}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                      <span className="input-group-text">credits</span>
                    </div>
                    <small className="text-muted">
                      Credits deducted when creating a new course
                    </small>
                  </div>

                  {/* Create Subject */}
                  <div className="mb-4">
                    <label htmlFor="subject" className="form-label fw-semibold">
                      <i className="bi bi-journal-bookmark me-2 text-info"></i>
                      Create Subject
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="subject"
                        name="subject"
                        value={pricing.subject}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                      <span className="input-group-text">credits</span>
                    </div>
                    <small className="text-muted">
                      Credits deducted when creating a new subject
                    </small>
                  </div>

                  {/* Add Result */}
                  <div className="mb-4">
                    <label htmlFor="result" className="form-label fw-semibold">
                      <i className="bi bi-clipboard-check me-2 text-warning"></i>
                      Add Result
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="result"
                        name="result"
                        value={pricing.result}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                      <span className="input-group-text">credits</span>
                    </div>
                    <small className="text-muted">
                      Credits deducted when adding a student result
                    </small>
                  </div>

                  {/* Create Certificate */}
                  <div className="mb-4">
                    <label htmlFor="certificate" className="form-label fw-semibold">
                      <i className="bi bi-award me-2 text-danger"></i>
                      Create Certificate
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="certificate"
                        name="certificate"
                        value={pricing.certificate}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                      <span className="input-group-text">credits</span>
                    </div>
                    <small className="text-muted">
                      Credits deducted when creating a certificate
                    </small>
                  </div>

                  {/* Submit Button */}
                  <div className="d-flex justify-content-end pt-3 border-top">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                About Credit Pricing
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-0">
                These settings control how many credits are deducted from a franchise account 
                when they perform various actions. Franchises must purchase credits to perform 
                these operations. Ensure pricing is fair and encourages active use of the platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
