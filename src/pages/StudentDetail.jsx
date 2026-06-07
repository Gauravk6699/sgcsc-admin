// src/pages/StudentDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from "../api/axiosInstance";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const s = await API.unwrap(API.get(`/students/${id}`));
      setStudent(s);
      const r = await API.unwrap(API.get(`/results/student/${id}`));
      setResults(Array.isArray(r) ? r : []);
    } catch (err) {
      console.error('student detail fetch', err);
      setMsg(err.userMessage || 'Failed to fetch student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="d-flex">
      <div className="flex-grow-1">
        <div className="p-4">
          <h2>Student details</h2>
          {msg && <div className="alert alert-info">{msg}</div>}
          {loading ? <div>Loading...</div> : student && (
            <>
              <div className="card mb-4 p-3">
                <h4>{student.name} <small className="text-muted">({student.rollNumber || student.rollNo})</small></h4>
                <div><strong>Course:</strong> {student.course?.title || student.courseName || student.course || '—'}</div>
                <div><strong>Semester:</strong> {student.semester}</div>
                <div><strong>Email:</strong> {student.email || '—'}</div>
                <div><strong>Contact:</strong> {student.mobile || student.contact || '—'}</div>
                <hr />
                <h6 className="text-muted">Fee Details</h6>
                
                {/* Course-wise Fee Breakdown */}
                {student.courses && student.courses.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>Course Name</th>
                          <th>Total Fee (₹)</th>
                          <th>Paid (₹)</th>
                          <th>Due (₹)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.courses.map((c, idx) => {
                          const courseFee = Number(c.feeAmount) || 0;
                          const coursePaid = Number(c.amountPaid) || 0;
                          const courseDue = courseFee - coursePaid;
                          return (
                            <tr key={idx}>
                              <td>{c.courseName || 'N/A'}</td>
                              <td>{courseFee}</td>
                              <td>{coursePaid}</td>
                              <td className={courseDue > 0 ? 'text-danger' : 'text-success'}>
                                {courseDue}
                              </td>
                              <td>
                                {courseDue <= 0 ? (
                                  <span className="badge bg-success">Paid</span>
                                ) : (
                                  <span className="badge bg-warning text-dark">Pending</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="table-secondary">
                          <th>Total</th>
                          {(() => {
                            const totalFee = student.courses.reduce((sum, c) => sum + (Number(c.feeAmount) || 0), 0);
                            const totalPaid = student.courses.reduce((sum, c) => sum + (Number(c.amountPaid) || 0), 0);
                            const totalDue = totalFee - totalPaid;
                            return (
                              <>
                                <th>₹{totalFee}</th>
                                <th>₹{totalPaid}</th>
                                <th className={totalDue > 0 ? 'text-danger' : 'text-success'}>₹{totalDue}</th>
                                <th>{totalDue <= 0 ? <span className="badge bg-success">All Paid</span> : <span className="badge bg-warning text-dark">Pending</span>}</th>
                              </>
                            );
                          })()}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    <div><strong>Total Fee:</strong> ₹{student.feeAmount || 0}</div>
                    <div><strong>Amount Paid:</strong> ₹{student.amountPaid || 0}</div>
                    <div>
                      <strong>Pending Amount:</strong>{' '}
                      <span className={((student.feeAmount || 0) - (student.amountPaid || 0)) > 0 ? 'text-danger' : 'text-success'}>
                        ₹{((student.feeAmount || 0) - (student.amountPaid || 0))}
                      </span>
                    </div>
                    <div><strong>Fees Paid:</strong> {student.feesPaid ? 'Yes' : 'No'}</div>
                  </>
                )}
              </div>

              <div className="card mb-4 p-3 d-flex flex-row align-items-center justify-content-between gap-3">
                <div>
                  <h5 className="mb-1">Results</h5>
                  <small className="text-muted">Enter subject-wise theory and practical marks from the Results page.</small>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/results/add?studentId=${id}`)}
                >
                  Enter Results
                </button>
              </div>

              <div className="card p-3">
                <h5>Results</h5>
                {results.length === 0 ? <div className="text-muted">No results yet</div> : (
                  <table className="table">
                    <thead><tr><th>Exam</th><th>Course</th><th>Sem</th><th>Marks</th><th>Declared</th></tr></thead>
                    <tbody>
                      {results.map(r => (
                        <tr key={r._id}>
                          <td>{r.exam || '-'}</td>
                          <td>{(r.course && r.course.title) || r.course || '-'}</td>
                          <td>{r.semester}</td>
                          <td>{r.marks}</td>
                          <td>{r.declared ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
