// src/pages/MarksheetList.jsx
import { useEffect, useMemo, useState } from 'react';
import API from "../api/axiosInstance";

// eslint-disable-next-line no-undef
const MarksheetGenerator = window.MarksheetGenerator;

let marksheetGenerator = null;

export default function MarksheetList() {
  const [marksheets, setMarksheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [viewImage, setViewImage] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const initGenerator = async () => {
    if (marksheetGenerator) return marksheetGenerator;

    if (typeof MarksheetGenerator !== 'undefined') {
      try {
        console.log('Loading marksheet template...');
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://sgcsc-backend.onrender.com/api';
        await MarksheetGenerator.fetchConfigFromAPI(apiBaseUrl);
        await MarksheetGenerator.loadTemplate('/marksheet-template.jpeg');
        console.log('Marksheet template loaded successfully');
        marksheetGenerator = MarksheetGenerator;
        return marksheetGenerator;
      } catch (err) {
        console.error('Failed to load marksheet template:', err);
        marksheetGenerator = MarksheetGenerator;
        return marksheetGenerator;
      }
    } else {
      console.warn('MarksheetGenerator not defined');
      return null;
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setMsg('');
    try {
      console.log('Loading marksheets from API...');
      const data = await API.unwrap(API.get('/marksheets'));
      console.log('Marksheets unwrapped data:', data);
      const marksheetsData = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      console.log('Setting marksheets:', marksheetsData);
      setMarksheets(marksheetsData);
    } catch (err) {
      console.error('load marksheets error:', err);
      console.error('Error response:', err.response?.data);
      setMsg(err.userMessage || err.response?.data?.message || 'Failed to load marksheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('MarksheetList mounted, loading marksheets...');
    loadAll();
    initGenerator();
  }, []);

  const handleDownload = async (marksheet) => {
    if (!marksheet) return;
    
    const generator = await initGenerator();
    
    if (!generator) {
      setMsg('Failed to load marksheet generator. Please check if the template is uploaded.');
      return;
    }
    
    try {
      await generator.download({
        enrollmentNo: marksheet.enrollmentNo,
        studentName: marksheet.studentName,
        fatherName: marksheet.fatherName,
        motherName: marksheet.motherName,
        courseName: marksheet.courseName,
        instituteName: marksheet.instituteName,
        rollNumber: marksheet.rollNumber,
        dob: marksheet.dob,
        coursePeriodFrom: marksheet.coursePeriodFrom,
        coursePeriodTo: marksheet.coursePeriodTo,
        courseDuration: marksheet.courseDuration,
        dateOfIssue: marksheet.dateOfIssue,
        subjects: marksheet.subjects,
        totalTheoryMarks: marksheet.totalTheoryMarks,
        totalPracticalMarks: marksheet.totalPracticalMarks,
        totalCombinedMarks: marksheet.totalCombinedMarks,
        maxTotalMarks: marksheet.maxTotalMarks,
        percentage: marksheet.percentage,
        overallGrade: marksheet.overallGrade,
      });
      setMsg('Marksheet downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setMsg('Failed to generate PDF: ' + err.message);
    }
  };

  const handleView = async (marksheet) => {
    if (!marksheet) return;
    
    const generator = await initGenerator();
    
    if (!generator) {
      setMsg('Failed to load marksheet generator.');
      return;
    }
    
    try {
      const dataURL = await generator.getDataURL({
        enrollmentNo: marksheet.enrollmentNo,
        studentName: marksheet.studentName,
        fatherName: marksheet.fatherName,
        motherName: marksheet.motherName,
        courseName: marksheet.courseName,
        instituteName: marksheet.instituteName,
        rollNumber: marksheet.rollNumber,
        dob: marksheet.dob,
        coursePeriodFrom: marksheet.coursePeriodFrom,
        coursePeriodTo: marksheet.coursePeriodTo,
        courseDuration: marksheet.courseDuration,
        dateOfIssue: marksheet.dateOfIssue,
        subjects: marksheet.subjects,
        totalTheoryMarks: marksheet.totalTheoryMarks,
        totalPracticalMarks: marksheet.totalPracticalMarks,
        totalCombinedMarks: marksheet.totalCombinedMarks,
        maxTotalMarks: marksheet.maxTotalMarks,
        percentage: marksheet.percentage,
        overallGrade: marksheet.overallGrade,
      });

      setViewImage(dataURL);
      setShowViewModal(true);
    } catch (err) {
      console.error('Error generating marksheet preview:', err);
      setMsg('Failed to generate preview: ' + err.message);
    }
  };

  const filteredMarksheets = useMemo(() => {
    if (!search.trim()) return marksheets;
    const s = search.trim().toLowerCase();
    return marksheets.filter((m) => {
      return (
        (m.enrollmentNo || '').toLowerCase().includes(s) ||
        (m.rollNumber || '').toLowerCase().includes(s) ||
        (m.studentName || '').toLowerCase().includes(s) ||
        (m.courseName || '').toLowerCase().includes(s) ||
        (m.instituteName || '').toLowerCase().includes(s)
      );
    });
  }, [marksheets, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this marksheet?')) return;
    try {
      await API.delete(`/marksheets/${id}`);
      setMarksheets((prev) => prev.filter((m) => (m._id || m.id) !== id));
      setMsg('Marksheet deleted.');
    } catch (err) {
      console.error('delete marksheet error:', err);
      setMsg(err.userMessage || 'Failed to delete marksheet');
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="mb-0">Marksheets</h2>
              <div className="small text-muted">
                List, search, download and delete marksheets
              </div>
            </div>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: 240 }}
                placeholder="Search by enrollment / roll / name / course"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={loadAll}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {msg && <div className="alert alert-info">{msg}</div>}

          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center text-muted">
                  Loading marksheets…
                </div>
              ) : filteredMarksheets.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No marksheets found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Enrollment No.</th>
                        <th>Roll No.</th>
                        <th>Student Name</th>
                        <th>Course</th>
                        <th>Institute</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMarksheets.map((m) => (
                        <tr key={m._id || m.id}>
                          <td>{m.enrollmentNo}</td>
                          <td>{m.rollNumber}</td>
                          <td>{m.studentName || '-'}</td>
                          <td>{m.courseName || '-'}</td>
                          <td>{m.instituteName || '-'}</td>
                          <td>{m.percentage ? `${m.percentage.toFixed(2)}%` : '-'}</td>
                          <td>{m.overallGrade || '-'}</td>
                           <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-info me-2"
                                onClick={() => handleView(m)}
                                title="View Marksheet"
                              >
                                View
                              </button>
                             <button
                               className="btn btn-sm btn-outline-success me-2"
                               onClick={() => handleDownload(m)}
                               title="Download/Print Marksheet"
                             >
                               Download
                             </button>
                             <button
                               className="btn btn-sm btn-outline-danger"
                               onClick={() =>
                                 handleDelete(m._id || m.id)
                               }
                             >
                               Delete
                             </button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for template-based marksheet generation */}
      <canvas id="marksheetCanvas" style={{ display: 'none' }}></canvas>

      {/* View Modal */}
      {showViewModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered" role="document" style={{ maxWidth: '90%', maxHeight: '90vh' }}>
            <div className="modal-content" style={{ maxHeight: '90vh' }}>
              <div className="modal-header">
                <h5 className="modal-title">Marksheet Preview</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                />
              </div>
              <div className="modal-body text-center" style={{ overflow: 'auto', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                {viewImage ? (
                  <img
                    src={viewImage}
                    alt="Marksheet Preview"
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="py-5 text-muted">
                    <p>Unable to generate preview.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
