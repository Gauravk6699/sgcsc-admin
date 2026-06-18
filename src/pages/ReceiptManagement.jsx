// src/pages/ReceiptManagement.jsx
import { useState, useEffect, useCallback } from "react";
import API from "../api/axiosInstance";

export default function ReceiptManagement() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    receiptNo: '',
    enrollmentNo: '',
    startDate: '',
    endDate: ''
  });

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await API.get(`/receipts?${params}`);
      setReceipts(response.data.data || []);
    } catch (error) {
      console.error('Fetch receipts error:', error);
      alert('Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleDelete = async (receiptId) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) return;

    try {
      await API.delete(`/receipts/${receiptId}`);
      alert('Receipt deleted successfully');
      fetchReceipts();
    } catch (error) {
      console.error('Delete receipt error:', error);
      alert('Failed to delete receipt');
    }
  };

  const handleEdit = (receipt) => {
    setSelectedReceipt(receipt);
    setEditForm({
      receiptNo: receipt.receiptNo,
      totalPaid: receipt.totalPaid,
      totalDue: receipt.totalDue,
      paymentMethod: receipt.paymentMethod,
      whatsappNumber: receipt.whatsappNumber,
      remarks: receipt.remarks,
      monthlyPayments: receipt.monthlyPayments || []
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await API.put(`/receipts/${selectedReceipt._id}`, editForm);
      alert('Receipt updated successfully');
      setShowEditModal(false);
      fetchReceipts();
    } catch (error) {
      console.error('Update receipt error:', error);
      alert('Failed to update receipt');
    } finally {
      setSaving(false);
    }
  };

  const printReceipt = (receipt) => {
    const monthlyRows = (receipt.monthlyPayments || []).map(p => `
      <tr>
        <td>${p.month || ''}</td>
        <td>${p.date || ''}</td>
        <td>${p.paid || 0}</td>
        <td>${p.due || 0}</td>
      </tr>`).join('');

    const totalPaid = receipt.totalPaid || 0;
    const totalDue  = receipt.totalDue  || 0;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fee Receipt - ${receipt.receiptNo}</title>
  <style>
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; font-family: Arial, sans-serif; }
    .receipt {
      width: 490px; margin: 20px auto; background: #fff;
      border: 4px solid #25D366; padding: 8px; font-size: 12px;
    }
    .center-name {
      width: 100%; margin: 5px auto 2px auto; background: #25D366;
      color: #fff; text-align: center; font-weight: bold; font-size: 16px;
      padding: 5px 0; border-radius: 10px; letter-spacing: 2px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .center-address { text-align: center; font-size: 13px; margin-bottom: 10px; color: #444; }
    .details { margin: 0 8px; }
    .detail-row { margin-bottom: 3px; }
    .label { display: inline-block; width: 110px; font-weight: bold; }
    .fee-title {
      margin: 8px auto; width: 75%; background: #25D366; color: #fff;
      text-align: center; font-weight: bold; padding: 8px 0;
      border-radius: 30px; letter-spacing: 1px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
    th, td { border: 1px solid #000; padding: 3px; text-align: center; }
    th { background: #eaeaea; }
    .footer { margin-top: 6px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center-name">
      <hr style="margin:2px 0;opacity:0.5"/>
      SHREE GANPATI COMPUTER AND STUDY CENTRE
      <hr style="margin:2px 0;opacity:0.5"/>
    </div>
    <div class="center-address"><u>RAIPUR CHIRAIYAKOT MAU</u></div>

    <div class="details">
      <div class="detail-row"><span class="label">Student's Name</span>: ${receipt.studentName || 'N/A'}</div>
      <div class="detail-row"><span class="label">Enrollment No</span>: ${receipt.enrollmentNo || 'N/A'}</div>
      <div class="detail-row"><span class="label">Course Name</span>: ${receipt.courseName || 'N/A'}</div>
      <div class="detail-row"><span class="label">Session</span>: ${receipt.sessionStart || ''} – ${receipt.sessionEnd || ''}</div>
      <div class="detail-row"><span class="label">Receipt No</span>: ${receipt.receiptNo || ''}</div>
      <div class="detail-row"><span class="label">Payment Method</span>: ${receipt.paymentMethod || 'Cash'}</div>
      <div class="detail-row"><span class="label">Date</span>: ${receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}</div>
      <div class="fee-title">STUDENT'S FEE RECEIPT</div>
    </div>

    <table>
      <thead>
        <tr><th>Month</th><th>Date</th><th>Paid</th><th>Due</th></tr>
      </thead>
      <tbody>
        ${monthlyRows}
        <tr>
          <th>Total</th><th>-</th><th>${totalPaid}</th><th>${totalDue}</th>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      Received By: ............................................................ All fees are non-refundable
    </div>
  </div>
  <script>window.print();</script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Receipt Management</h2>
        <button className="btn btn-primary" onClick={fetchReceipts}>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Receipt No"
                value={filters.receiptNo}
                onChange={(e) => setFilters({...filters, receiptNo: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enrollment No"
                value={filters.enrollmentNo}
                onChange={(e) => setFilters({...filters, enrollmentNo: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                placeholder="End Date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-secondary w-100" onClick={() => setFilters({...filters, page: 1})}>
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status" />
              <p className="mt-2">Loading receipts...</p>
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No receipts found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Student</th>
                    <th>Enrollment No</th>
                    <th>Course</th>
                    <th>Total Paid</th>
                    <th>Total Due</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt._id}>
                      <td>{receipt.receiptNo}</td>
                      <td>{receipt.studentName}</td>
                      <td>{receipt.enrollmentNo}</td>
                      <td>{receipt.courseName}</td>
                      <td>₹{receipt.totalPaid}</td>
                      <td>₹{receipt.totalDue}</td>
                      <td>{new Date(receipt.paymentDate).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => printReceipt(receipt)}
                          title="Print"
                        >
                          🖨️
                        </button>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => handleEdit(receipt)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(receipt._id)}
                          title="Delete"
                        >
                          🗑️
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Receipt - {selectedReceipt?.receiptNo}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Receipt No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.receiptNo}
                      onChange={(e) => setEditForm({...editForm, receiptNo: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Total Paid</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editForm.totalPaid}
                      onChange={(e) => setEditForm({...editForm, totalPaid: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Total Due</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editForm.totalDue}
                      onChange={(e) => setEditForm({...editForm, totalDue: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">WhatsApp Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.whatsappNumber}
                      onChange={(e) => setEditForm({...editForm, whatsappNumber: e.target.value})}
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editForm.remarks}
                      onChange={(e) => setEditForm({...editForm, remarks: e.target.value})}
                    />
                  </div>
                </div>

                {/* Monthly Payments Section */}
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Monthly Payments</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => {
                        const newPayment = {
                          month: `Month ${editForm.monthlyPayments.length + 1}`,
                          date: new Date().toISOString().split('T')[0],
                          paid: 0,
                          due: 0,
                          status: 'Pending'
                        };
                        setEditForm({
                          ...editForm,
                          monthlyPayments: [...editForm.monthlyPayments, newPayment]
                        });
                      }}
                    >
                      + Add Month
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Date</th>
                          <th>Paid</th>
                          <th>Due</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editForm.monthlyPayments && editForm.monthlyPayments.map((payment, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={payment.month}
                                onChange={(e) => {
                                  const updatedPayments = [...editForm.monthlyPayments];
                                  updatedPayments[index] = { ...payment, month: e.target.value };
                                  setEditForm({...editForm, monthlyPayments: updatedPayments});
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={payment.date ? payment.date.split('T')[0] : ''}
                                onChange={(e) => {
                                  const updatedPayments = [...editForm.monthlyPayments];
                                  updatedPayments[index] = { ...payment, date: e.target.value };
                                  setEditForm({...editForm, monthlyPayments: updatedPayments});
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={payment.paid || 0}
                                onChange={(e) => {
                                  const updatedPayments = [...editForm.monthlyPayments];
                                  updatedPayments[index] = { ...payment, paid: parseFloat(e.target.value) || 0 };
                                  setEditForm({...editForm, monthlyPayments: updatedPayments});
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={payment.due || 0}
                                onChange={(e) => {
                                  const updatedPayments = [...editForm.monthlyPayments];
                                  updatedPayments[index] = { ...payment, due: parseFloat(e.target.value) || 0 };
                                  setEditForm({...editForm, monthlyPayments: updatedPayments});
                                }}
                              />
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={payment.status}
                                onChange={(e) => {
                                  const updatedPayments = [...editForm.monthlyPayments];
                                  updatedPayments[index] = { ...payment, status: e.target.value };
                                  setEditForm({...editForm, monthlyPayments: updatedPayments});
                                }}
                              >
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Partial">Partial</option>
                              </select>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  const updatedPayments = editForm.monthlyPayments.filter((_, i) => i !== index);
                                  setEditForm({...editForm, monthlyPayments: updatedPayments});
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}