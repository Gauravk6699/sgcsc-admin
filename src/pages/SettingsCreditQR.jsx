// src/pages/SettingsCreditQR.jsx
import React, { useState, useEffect, useRef } from "react";
import { getCreditSettings, uploadCreditTopupQR, deleteCreditTopupQR, updateCreditTopupInstructions } from "../api/api";

export default function SettingsCreditQR() {
  const [qrCode, setQrCode] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch current settings on mount
  useEffect(() => {
    fetchCreditSettings();
  }, []);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchCreditSettings = async () => {
    try {
      setFetching(true);
      const settings = await getCreditSettings();
      if (settings) {
        setQrCode(settings.qrCode || null);
        setInstructions(settings.instructions || "");
      }
    } catch (err) {
      console.error("Error fetching credit settings:", err);
      setMessage({ type: "error", text: "Failed to load credit QR settings" });
    } finally {
      setFetching(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Please select a valid image file (JPG or PNG)" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage({ type: "", text: "" });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a file to upload" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("qrCode", selectedFile);

      const res = await uploadCreditTopupQR(formData);
      if (res?.success) {
        setMessage({ type: "success", text: "QR code uploaded successfully!" });
        setQrCode(res.data?.qrCode || null);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } else {
        setMessage({ type: "error", text: "Failed to upload QR code" });
      }
    } catch (err) {
      console.error("Error uploading QR code:", err);
      setMessage({
        type: "error",
        text: err.userMessage || "Failed to upload QR code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete the QR code?")) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await deleteCreditTopupQR();
      if (res?.success) {
        setMessage({ type: "success", text: "QR code deleted successfully!" });
        setQrCode(null);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } else {
        setMessage({ type: "error", text: "Failed to delete QR code" });
      }
    } catch (err) {
      console.error("Error deleting QR code:", err);
      setMessage({
        type: "error",
        text: err.userMessage || "Failed to delete QR code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstructionsChange = (e) => {
    setInstructions(e.target.value);
  };

  const handleInstructionsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await updateCreditTopupInstructions({ instructions });
      if (res?.success) {
        setMessage({ type: "success", text: "Instructions updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update instructions" });
      }
    } catch (err) {
      console.error("Error updating instructions:", err);
      setMessage({
        type: "error",
        text: err.userMessage || "Failed to update instructions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayQrCode = previewUrl || qrCode;

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-2 fw-bold">Credit Top-up QR Settings</h2>
          <p className="text-muted mb-4">
            Configure the QR code and instructions for franchise credit top-up payments.
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

          {fetching ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading QR settings...</p>
            </div>
          ) : (
            <>
              {/* QR Code Section */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="bi bi-qr-code me-2 text-primary"></i>
                    QR Code Upload
                  </h5>
                </div>
                <div className="card-body">
                  {/* Current QR Display */}
                  {displayQrCode ? (
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        {previewUrl ? "Preview:" : "Current QR Code:"}
                      </label>
                      <div className="d-flex flex-column align-items-start gap-3">
                        <div className="border rounded p-3 bg-white">
                          <img
                            src={displayQrCode}
                            alt="Credit Top-up QR Code"
                            style={{ maxWidth: "250px", maxHeight: "250px" }}
                            className="img-fluid"
                          />
                        </div>
                        {!previewUrl && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={handleDelete}
                            disabled={loading}
                          >
                            <i className="bi bi-trash me-2"></i>
                            Delete QR Code
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        No QR code uploaded yet. Please upload a QR code for franchise credit top-up payments.
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="mb-3">
                    <label htmlFor="qrCodeFile" className="form-label fw-semibold">
                      <i className="bi bi-upload me-2 text-success"></i>
                      Upload New QR Code
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="qrCodeFile"
                      name="qrCodeFile"
                      ref={fileInputRef}
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      disabled={loading}
                    />
                    <small className="text-muted d-block mt-1">
                      Accepted formats: JPG, PNG. Maximum file size: 5MB.
                    </small>
                  </div>

                  {/* Upload Actions */}
                  {selectedFile && (
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cloud-upload me-2"></i>
                            Upload QR Code
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleCancelSelection}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions Section */}
              <div className="card shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="bi bi-file-text me-2 text-info"></i>
                    Top-up Instructions
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleInstructionsSubmit}>
                    <div className="mb-3">
                      <label htmlFor="instructions" className="form-label fw-semibold">
                        Payment Instructions
                      </label>
                      <textarea
                        className="form-control"
                        id="instructions"
                        name="instructions"
                        rows="5"
                        value={instructions}
                        onChange={handleInstructionsChange}
                        placeholder="Enter instructions for franchise credit top-up payments. For example: Scan the QR code to make payment, then share the screenshot with admin for verification."
                        disabled={loading}
                      ></textarea>
                      <small className="text-muted d-block mt-1">
                        These instructions will be displayed to franchises when they request a credit top-up.
                      </small>
                    </div>

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
                            Save Instructions
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Preview Card */}
              {(qrCode || instructions) && (
                <div className="card shadow-sm mt-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Preview</h5>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-3">
                      This is how the QR code and instructions will appear to franchises:
                    </p>
                    {qrCode && (
                      <div className="mb-3">
                        <img
                          src={qrCode}
                          alt="QR Code Preview"
                          style={{ maxWidth: "150px", maxHeight: "150px" }}
                          className="img-fluid border rounded p-2 bg-white"
                        />
                      </div>
                    )}
                    {instructions && (
                      <div className="alert alert-light border">
                        <h6 className="fw-semibold mb-2">Instructions:</h6>
                        <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                          {instructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
