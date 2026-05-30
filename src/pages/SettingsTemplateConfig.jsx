// src/pages/SettingsTemplateConfig.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getCertificateTemplateConfig, updateCertificateTemplateConfig } from "../api/api";

const TEMPLATE_TYPES = [
  { key: "typingCertificate", name: "Typing Certificate", fields: [
    "studentName", "fatherHusbandName", "motherName", "enrollmentNumber",
    "computerTyping", "certificateNo", "dateOfIssue", "sessionFrom", "sessionTo", "grade", "studyCentre", "wordsPerMinute"
  ]},
  { key: "franchiseCertificate", name: "Franchise Certificate", fields: [
    "trainingCentreName", "applicantName", "atcCode", "atcCode2", "dateOfIssue", "dateOfRenewal"
  ]},
  { key: "studentCertificate", name: "Student Certificate", fields: [
    "centerName", "studentNameCombined", "courseName", "grade", "gradeExtra", "courseDuration",
    "coursePeriodFrom", "coursePeriodTo", "certificateNumber", "dateOfIssue", "photo"
  ]},
  { key: "marksheet", name: "Marksheet", fields: [
    "enrollmentNo", "rollNumber", "studentName", "fatherName", "motherName",
    "dob", "courseName", "courseDuration", "coursePeriodFrom", "coursePeriodTo", "instituteName",
    "subjectsStartY", "subjectRowHeight"
  ]}
];

const FIELD_LABELS = {
  studentName: "Student Name",
  fatherHusbandName: "Father/Husband Name",
  motherName: "Mother Name",
  enrollmentNumber: "Enrollment Number",
  enrollmentNo: "Enrollment No",
  rollNumber: "Roll Number",
  computerTyping: "Computer Typing",
  certificateNo: "Certificate No",
  dateOfIssue: "Date of Issue",
  sessionFrom: "Session From",
  sessionTo: "Session To",
  grade: "Grade",
  studyCentre: "Study Centre",
  wordsPerMinute: "Words Per Minute",
  fatherName: "Father Name",
  courseName: "Course Name",
  session: "Session",
  certificateNumber: "Certificate Number",
  issueDate: "Issue Date",
  examRollNo: "Exam Roll No",
  examDate: "Exam Date",
  dob: "Date of Birth",
  courseDuration: "Course Duration",
  coursePeriodFrom: "Course Period From",
  coursePeriodTo: "Course Period To",
  instituteName: "Institute Name",
  subjectsStartY: "Subjects Table Start Y (%)",
  subjectRowHeight: "Subject Row Height (%)",
  trainingCentreName: "Training Centre Name",
  applicantName: "Applicant Name",
  atcCode2: "ATC Code 2",
  dateOfRenewal: "Date of Renewal",
  studentNameCombined: "Student Name (Combined)",
  gradeExtra: "Grade Extra",
  photo: "Photo (x, y, width, height)"
};

const SAMPLE_DATA = {
  typingCertificate: {
    studentName: "John Doe",
    fatherHusbandName: "Robert Doe",
    motherName: "Mary Doe",
    enrollmentNumber: "EN/2024/001",
    computerTyping: "English/Hindi Typing",
    certificateNo: "TC/2024/0001",
    dateOfIssue: "2024-03-15",
    sessionFrom: "2020",
    sessionTo: "2021",
    grade: "A+",
    studyCentre: "xyz",
    wordsPerMinute: "50"
  },
  franchiseCertificate: {
    trainingCentreName: "Main Training Centre",
    applicantName: "John Doe",
    atcCode: "ATC12345",
    atcCode2: "ATC12345",
    dateOfIssue: "2024-03-15",
    dateOfRenewal: "2025-03-15"
  },
  studentCertificate: {
    centerName: "Main Training Center",
    studentNameCombined: "John Doe S/O Robert Doe",
    courseName: "Certificate in Computer Application",
    grade: "A+",
    gradeExtra: "A+",
    courseDuration: "1 Year",
    coursePeriodFrom: "2023-04-01",
    coursePeriodTo: "2024-03-31",
    certificateNumber: "CERT-2024-001",
    dateOfIssue: "2024-03-15",
    photo: "/sample-photo.jpg"
  },
  marksheet: {
    enrollmentNo: "EN/2024/001",
    studentName: "John Doe",
    fatherName: "Robert Doe",
    motherName: "Jane Doe",
    courseName: "Certificate in Computer Application",
    instituteName: "SGCSC Institute",
    rollNumber: "EX/2024/001",
    dob: "2000-01-15",
    coursePeriodFrom: "2023-04-01",
    coursePeriodTo: "2024-03-31",
    courseDuration: "1 Year",
    subjects: [
      {
        subjectName: "Computer Fundamentals",
        theoryMarks: 80,
        practicalMarks: 20,
        combinedMarks: 100,
        maxCombinedMarks: 100,
        grade: "A+"
      },
      {
        subjectName: "MS Office",
        theoryMarks: 75,
        practicalMarks: 25,
        combinedMarks: 100,
        maxCombinedMarks: 100,
        grade: "A"
      },
      {
        subjectName: "Internet & Email",
        theoryMarks: 85,
        practicalMarks: 15,
        combinedMarks: 100,
        maxCombinedMarks: 100,
        grade: "A+"
      }
    ],
    totalTheoryMarks: 240,
    totalPracticalMarks: 60,
    totalCombinedMarks: 300,
    maxTotalMarks: 300,
    percentage: 100,
    overallGrade: "A+"
  }
};

export default function SettingsTemplateConfig() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTemplate, setActiveTemplate] = useState("typingCertificate");
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const loadGeneratorScript = async (generatorName, templatePath) => {
    return new Promise((resolve, reject) => {
      if (window[generatorName]) {
        resolve();
        return;
      }

      const certScript = document.createElement('script');
      const scriptName = generatorName.replace('Generator', '-generator').toLowerCase();
      certScript.src = `/${scriptName}.js`;
      certScript.onload = async () => {
        try {
          const generator = window[generatorName];
          await generator.loadTemplate(templatePath);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      certScript.onerror = () => reject(new Error(`Failed to load ${scriptName}`));
      document.body.appendChild(certScript);
    });
  };

  const generatePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const templateMap = {
        typingCertificate: { generator: 'TypingCertificateGenerator', canvas: 'typingCertCanvas', template: (config.typingCertificate?.templatePath) || '/typing-certificate-template.jpeg' },
        franchiseCertificate: { generator: 'FranchiseCertificateGenerator', canvas: 'franchiseCertCanvas', template: (config.franchiseCertificate?.templatePath) || '/franchise-certificate-template.jpeg' },
        studentCertificate: { generator: 'CertificateGenerator', canvas: 'certCanvas', template: (config.studentCertificate?.templatePath) || '/student-certificate-template.jpeg' },
        marksheet: { generator: 'MarksheetGenerator', canvas: 'marksheetCanvas', template: (config.marksheet?.templatePath) || '/marksheet-template.jpeg' }
      };
      const template = templateMap[activeTemplate];
      if (!template) return;

      let generator = window[template.generator];
      if (!generator) {
        await loadGeneratorScript(template.generator, template.template);
        generator = window[template.generator];
      }

      if (!generator) {
        throw new Error(`Failed to load ${template.generator}`);
      }

      await generator.loadTemplate(template.template);
      generator.updateConfig ? generator.updateConfig({ fields: config[activeTemplate] }) : generator.updateFieldPositions(config[activeTemplate]);

      const canvas = document.getElementById(template.canvas);
      if (!canvas) {
        const newCanvas = document.createElement('canvas');
        newCanvas.id = template.canvas;
        newCanvas.style.display = 'none';
        document.body.appendChild(newCanvas);
      }

      const sampleData = SAMPLE_DATA[activeTemplate];
      const dataURL = await generator.getDataURL(sampleData);
      setPreviewImage(dataURL);
    } catch (err) {
      console.error("Error generating preview:", err);
      setMessage({ type: "warning", text: "Preview not available: " + err.message });
      setPreviewImage(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [activeTemplate, config]);

  useEffect(() => {
    if (showPreview) {
      generatePreview();
    }
  }, [showPreview, generatePreview]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getCertificateTemplateConfig();
      let initialConfig = data || {};
      // Set default values for studentCertificate if not present or empty
      if (!initialConfig.studentCertificate || Object.keys(initialConfig.studentCertificate).length === 0) {
        initialConfig.studentCertificate = {
          centerName: { x: 18, y: 52.7, font: '60px serif', color: '#000000', align: 'left' },
          studentNameCombined: { x: 50, y: 49, font: '60px serif', color: '#000000', align: 'center' },
          courseName: { x: 50, y: 58.5, font: '60px serif', color: '#000000', align: 'center' },
          grade: { x: 56.5, y: 55.5, font: '50px serif', color: '#000000', align: 'left' },
          gradeExtra: { x: 80, y: 76.3, font: '60px serif', color: '#000000', align: 'left' },
          courseDuration: { x: 54, y: 61.5, font: '60px serif', color: '#000000', align: 'left' },
          coursePeriodFrom: { x: 41.5, y: 64.3, font: '55px serif', color: '#000000', align: 'left' },
          coursePeriodTo: { x: 61, y: 64.3, font: '55px serif', color: '#000000', align: 'left' },
          certificateNumber: { x: 23, y: 93, font: '40px serif', color: '#000000', align: 'left' },
          dateOfIssue: { x: 55, y: 93, font: '40px serif', color: '#000000', align: 'left' },
          photo: { x: 10, y: 10, width: 20, height: 25 }
        };
      }
      setConfig(initialConfig);
    } catch (err) {
      console.error("Error fetching template config:", err);
      setMessage({ type: "danger", text: "Failed to load template configuration" });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (templateKey, fieldKey, property, value) => {
    setConfig(prev => ({
      ...prev,
      [templateKey]: {
        ...(prev[templateKey] || {}),
        [fieldKey]: {
          ...((prev[templateKey] || {})[fieldKey] || {}),
          [property]: property === "x" || property === "y" ? parseFloat(value) || 0 : value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await updateCertificateTemplateConfig(config);
      if (res?.success) {
        setMessage({ type: "success", text: "Template configuration saved successfully!" });
      } else {
        setMessage({ type: "danger", text: "Failed to save configuration" });
      }
    } catch (err) {
      console.error("Error saving template config:", err);
      setMessage({ type: "danger", text: err.response?.data?.message || "Failed to save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all template configurations to defaults?")) {
      fetchConfig();
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading template configuration...</p>
        </div>
      </div>
    );
  }

  const activeTemplateData = TEMPLATE_TYPES.find(t => t.key === activeTemplate);

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="mb-0 fw-bold">Settings – Certificate Template Configuration</h2>
              <p className="text-muted mb-0">
                Configure field positions. Values in percentage (0-100).
              </p>
            </div>
            <button
              className="btn btn-success"
              onClick={() => setShowPreview(true)}
            >
              <i className="bi bi-eye me-2"></i>
              Preview
            </button>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ type: "", text: "" })}></button>
            </div>
          )}

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                {TEMPLATE_TYPES.map(template => (
                  <li className="nav-item" key={template.key}>
                    <button
                      className={`nav-link ${activeTemplate === template.key ? 'active' : ''}`}
                      onClick={() => setActiveTemplate(template.key)}
                    >
                      {template.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "25%" }}>Field</th>
                        <th>X (%)</th>
                        <th>Y (%)</th>
                        <th>Width (%)</th>
                        <th>Height (%)</th>
                        <th>Font</th>
                        <th>Color</th>
                        <th>Align</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTemplateData.fields.map(field => {
                        const fieldConfig = (config[activeTemplate] || {})[field] || {};
                        return (
                          <tr key={field}>
                            <td>
                              <strong>{FIELD_LABELS[field] || field}</strong>
                              <small className="d-block text-muted">{field}</small>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={fieldConfig.x ?? ""}
                                onChange={(e) => handleFieldChange(activeTemplate, field, "x", e.target.value)}
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0-100"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={fieldConfig.y ?? ""}
                                onChange={(e) => handleFieldChange(activeTemplate, field, "y", e.target.value)}
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0-100"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={fieldConfig.width ?? ""}
                                onChange={(e) => handleFieldChange(activeTemplate, field, "width", e.target.value)}
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0-100"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={fieldConfig.height ?? ""}
                                onChange={(e) => handleFieldChange(activeTemplate, field, "height", e.target.value)}
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0-100"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={fieldConfig.font ?? ""}
                                onChange={(e) => handleFieldChange(activeTemplate, field, "font", e.target.value)}
                                placeholder="e.g., bold 100px serif"
                              />
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <input
                                  type="color"
                                  className="form-control form-control-color form-control-sm"
                                  value={fieldConfig.color || "#000000"}
                                  onChange={(e) => handleFieldChange(activeTemplate, field, "color", e.target.value)}
                                  style={{ width: 40, padding: "2px" }}
                                />
                                <input
                                  type="text"
                                  className="form-control form-control-sm ms-1"
                                  value={fieldConfig.color ?? ""}
                                  onChange={(e) => handleFieldChange(activeTemplate, field, "color", e.target.value)}
                                  placeholder="#000000"
                                  style={{ width: 80 }}
                                />
                              </div>
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={fieldConfig.align ?? "left"}
                                onChange={(e) => handleFieldChange(activeTemplate, field, "align", e.target.value)}
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between pt-3 border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={resetToDefaults}>
                    Reset to Defaults
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Position Guide</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>X Position (Horizontal)</h6>
                  <ul className="list-unstyled text-muted">
                    <li>0 = Left edge</li>
                    <li>50 = Center</li>
                    <li>100 = Right edge</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Y Position (Vertical)</h6>
                  <ul className="list-unstyled text-muted">
                    <li>0 = Top edge</li>
                    <li>50 = Middle</li>
                    <li>100 = Bottom edge</li>
                  </ul>
                </div>
              </div>
              <hr />
              <h6>Font Format</h6>
              <p className="text-muted">
                Format: <code>style size unit family</code><br />
                Examples: <code>bold 100px serif</code>, <code>italic 80px Arial</code>, <code>60px sans-serif</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered" role="document" style={{ maxWidth: '90%', maxHeight: '90vh' }}>
            <div className="modal-content" style={{ maxHeight: '90vh' }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  Preview: {activeTemplateData.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPreview(false)}
                />
              </div>
              <div className="modal-body text-center" style={{ overflow: 'auto', backgroundColor: '#f8f9fa' }}>
                {previewLoading ? (
                  <div className="py-5">
                    <div className="spinner-border text-primary mb-3" />
                    <p className="text-muted">Generating preview...</p>
                  </div>
                ) : previewImage ? (
                  <img
                    src={previewImage}
                    alt="Certificate Preview"
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="py-5 text-muted">
                    <p>Unable to generate preview.</p>
                    <p className="small">Make sure the template JPEG file is uploaded to the public folder.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={generatePreview}
                  disabled={previewLoading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvases for preview generation */}
      <canvas id="typingCertCanvas" ref={canvasRef} style={{ display: 'none' }}></canvas>
      <canvas id="franchiseCertCanvas" style={{ display: 'none' }}></canvas>
      <canvas id="marksheetCanvas" style={{ display: 'none' }}></canvas>
    </div>
  );
}