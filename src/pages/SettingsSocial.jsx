// src/pages/SettingsSocial.jsx
import React, { useState, useEffect } from "react";
import { getSettings, updateSocialLinks } from "../api/api";

export default function SettingsSocial() {
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    twitter: "",
    facebook: "",
    youtube: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch current settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const settings = await getSettings();
      if (settings?.socialLinks) {
        setSocialLinks(settings.socialLinks);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setMessage({ type: "error", text: "Failed to load social links" });
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSocialLinks((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await updateSocialLinks(socialLinks);
      if (res?.success) {
        setMessage({ type: "success", text: "Social links updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update social links" });
      }
    } catch (err) {
      console.error("Error updating social links:", err);
      setMessage({
        type: "error",
        text: err.userMessage || "Failed to update social links",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-2 fw-bold">Settings – Social Links</h2>
          <p className="text-muted mb-4">
            Configure social media links that will appear on the website.
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
                  <p className="mt-2 text-muted">Loading settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Instagram */}
                  <div className="mb-4">
                    <label htmlFor="instagram" className="form-label fw-semibold">
                      <i className="bi bi-instagram me-2 text-danger"></i>
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="instagram"
                      name="instagram"
                      value={socialLinks.instagram}
                      onChange={handleChange}
                      placeholder="https://instagram.com/yourusername"
                    />
                    <small className="text-muted">
                      Enter your Instagram profile URL
                    </small>
                  </div>

                  {/* Twitter/X */}
                  <div className="mb-4">
                    <label htmlFor="twitter" className="form-label fw-semibold">
                      <i className="bi bi-twitter-x me-2"></i>
                      Twitter/X URL
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="twitter"
                      name="twitter"
                      value={socialLinks.twitter}
                      onChange={handleChange}
                      placeholder="https://twitter.com/yourusername"
                    />
                    <small className="text-muted">
                      Enter your Twitter/X profile URL
                    </small>
                  </div>

                  {/* Facebook */}
                  <div className="mb-4">
                    <label htmlFor="facebook" className="form-label fw-semibold">
                      <i className="bi bi-facebook me-2 text-primary"></i>
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="facebook"
                      name="facebook"
                      value={socialLinks.facebook}
                      onChange={handleChange}
                      placeholder="https://facebook.com/yourpagename"
                    />
                    <small className="text-muted">
                      Enter your Facebook page URL
                    </small>
                  </div>

                  {/* YouTube */}
                  <div className="mb-4">
                    <label htmlFor="youtube" className="form-label fw-semibold">
                      <i className="bi bi-youtube me-2 text-danger"></i>
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="youtube"
                      name="youtube"
                      value={socialLinks.youtube}
                      onChange={handleChange}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                    <small className="text-muted">
                      Enter your YouTube channel URL
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

          {/* Preview Card */}
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Preview</h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">
                These icons will appear as a sticky sidebar on the website:
              </p>
              <div className="d-flex gap-3">
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-danger"
                  >
                    <i className="bi bi-instagram fs-4"></i>
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-dark"
                  >
                    <i className="bi bi-twitter-x fs-4"></i>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary"
                  >
                    <i className="bi bi-facebook fs-4"></i>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-danger"
                  >
                    <i className="bi bi-youtube fs-4"></i>
                  </a>
                )}
                {!socialLinks.instagram &&
                  !socialLinks.twitter &&
                  !socialLinks.facebook &&
                  !socialLinks.youtube && (
                    <span className="text-muted">No links configured yet</span>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
