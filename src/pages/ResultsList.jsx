// src/pages/ResultsList.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../api/axiosInstance";

export default function ResultsList() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  const [search, setSearch] = useState('');

  const [viewingResult, setViewingResult] = useState(null);

  const fetchResults = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await API.get('/results');
      const arr = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setResults(arr);
    } catch (err) {
      console.error('fetch results', err);
      setMsgType('danger');
      setMsg(err.response?.data?.message || err.userMessage || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    setMsg('');
    try {
      await API.delete(`/results/${id}`);
      setResults((prev) => prev.filter((r) => r._id !== id));
      setMsgType('success');
      setMsg('Result deleted.');
    } catch (err) {
      console.error('delete result', err);
      setMsgType('danger');
      setMsg(err.response?.data?.message || 'Failed to delete result');
    }
  };

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return results;

    return results.filter((r) => {
      const roll = (r.rollNumber || '').toLowerCase();
      const studentName = (r.student?.name || '').toLowerCase();
      const courseName = (r.course?.title || r.course?.name || '').toLowerCase();
      return roll.includes(q) || studentName.includes(q) || courseName.includes(q);
    });
  }, [results, search]);

  // Calculate grade color
  const getGradeColor = (grade) => {
    if (!grade) return 'secondary';
    if (grade === 'A+' || grade === 'A') return 'success';
    if (grade === 'B+' || grade === 'B') return 'primary';
    if (grade === 'C') return 'warning';
    if (grade === 'D') return 'secondary';
    return 'danger';
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="mb-0">Results</h2>
              <div className="small text-muted">
                Manage student results with subject-wise marks
              </div>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by roll no / student / course"
                style={{ minWidth: 220 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={fetchResults}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/results/create')}
              >
                Add Result
              </button>
            </div>
          </div>

          {msg && (
            <div
              className={`alert alert-${
                msgType === 'danger'
                  ? 'danger'
                  : msgType === 'success'
                  ? 'success'
                  : 'info'
              }`}
            >
              {msg}
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-3 text-center">Loading results…</div>
              ) : filteredResults.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  No results found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Roll No</th>
                        <th>Course</th>
                        <th className="text-center">Subjects</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">Percentage</th>
                        <th className="text-center">Grade</th>
                        <th className="text-center">Status</th>
                        <th style={{ width: 140 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((r) => (
                        <tr key={r._id}>
                          <td>
                            <div>
                              <strong>{r.student?.name || 'N/A'}</strong>
                            </div>
                            {r.student?.courseName && (
                              <small className="text-muted">
                                {r.student.courseName}
                              </small>
                            )}
                          </td>
                          <td>{r.rollNumber}</td>
                          <td>{r.course?.title || r.course?.name || 'N/A'}</td>
                          <td className="text-center">
                            <span className="badge bg-secondary">
                              {r.subjects?.length || 0}
                            </span>
                          </td>
                          <td className="text-center">
                            {r.totalObtained}/{r.totalMarks}
                          </td>
                          <td className="text-center">
                            <span
                              className={
                                r.percentage >= 40
                                  ? 'text-success fw-bold'
                                  : 'text-danger fw-bold'
                              }
                            >
                              {r.percentage}%
                            </span>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge bg-${getGradeColor(r.overallGrade)}`}
                            >
                              {r.overallGrade || 'N/A'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge bg-${
                                r.resultStatus === 'pass'
                                  ? 'success'
                                  : r.resultStatus === 'fail'
                                  ? 'danger'
                                  : 'warning'
                              }`}
                            >
                              {r.resultStatus?.toUpperCase() || 'PENDING'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => setViewingResult(r)}
                            >
                              View
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(r._id)}
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

      {/* View Result Modal */}
      {viewingResult && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Result Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingResult(null)}
                />
              </div>
              <div className="modal-body">
                {/* Student Info */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Student:</strong> {viewingResult.student?.name || 'N/A'}
                    </p>
                    <p className="mb-1">
                      <strong>Roll Number:</strong> {viewingResult.rollNumber}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Course:</strong>{' '}
                      {viewingResult.course?.title || viewingResult.course?.name || 'N/A'}
                    </p>
                    <p className="mb-1">
                      <strong>Exam Session:</strong> {viewingResult.examSession || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Subject Marks Table */}
                <h6>Subject-wise Marks</h6>
                <table className="table table-bordered table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Subject</th>
                      <th className="text-center">Max</th>
                      <th className="text-center">Obtained</th>
                      <th className="text-center">Practical</th>
                      <th className="text-center">Total</th>
                      <th className="text-center">Grade</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingResult.subjects?.map((sub, idx) => (
                      <tr key={idx}>
                        <td>{sub.subjectName}</td>
                        <td className="text-center">{sub.maxMarks}</td>
                        <td className="text-center">{sub.marksObtained}</td>
                        <td className="text-center">{sub.practicalMarks || 0}</td>
                        <td className="text-center">
                          {(sub.marksObtained || 0) + (sub.practicalMarks || 0)}
                        </td>
                        <td className="text-center">
                          <span className={`badge bg-${getGradeColor(sub.grade)}`}>
                            {sub.grade}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge bg-${
                              sub.status === 'pass' ? 'success' : 'danger'
                            }`}
                          >
                            {sub.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-secondary">
                    <tr>
                      <th>Total</th>
                      <th className="text-center">{viewingResult.totalMarks}</th>
                      <th colSpan="2"></th>
                      <th className="text-center">{viewingResult.totalObtained}</th>
                      <th className="text-center">
                        <span className={`badge bg-${getGradeColor(viewingResult.overallGrade)}`}>
                          {viewingResult.overallGrade}
                        </span>
                      </th>
                      <th className="text-center">
                        <span
                          className={`badge bg-${
                            viewingResult.resultStatus === 'pass' ? 'success' : 'danger'
                          }`}
                        >
                          {viewingResult.resultStatus?.toUpperCase()}
                        </span>
                      </th>
                    </tr>
                  </tfoot>
                </table>

                {/* Summary */}
                <div className="row mt-3">
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body py-2">
                        <h4 className="mb-0">{viewingResult.percentage}%</h4>
                        <small className="text-muted">Percentage</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body py-2">
                        <h4 className={`mb-0 text-${getGradeColor(viewingResult.overallGrade)}`}>
                          {viewingResult.overallGrade}
                        </h4>
                        <small className="text-muted">Grade</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body py-2">
                        <h4
                          className={`mb-0 ${
                            viewingResult.resultStatus === 'pass'
                              ? 'text-success'
                              : 'text-danger'
                          }`}
                        >
                          {viewingResult.resultStatus?.toUpperCase()}
                        </h4>
                        <small className="text-muted">Result</small>
                      </div>
                    </div>
                  </div>
                </div>

                {viewingResult.remarks && (
                  <div className="mt-3">
                    <strong>Remarks:</strong>
                    <p className="mb-0 text-muted">{viewingResult.remarks}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingResult(null)}
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
