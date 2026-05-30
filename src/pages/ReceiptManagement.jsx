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
    // Open print view with receipt data
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Receipt - ${receipt.receiptNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { border: 2px solid #25D366; padding: 20px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>SGCSC Fee Receipt</h2>
              <p><strong>Receipt No:</strong> ${receipt.receiptNo}</p>
            </div>
            <div class="details">
              <p><strong>Student Name:</strong> ${receipt.studentName}</p>
              <p><strong>Enrollment No:</strong> ${receipt.enrollmentNo}</p>
              <p><strong>Course:</strong> ${receipt.courseName}</p>
              <p><strong>Session:</strong> ${receipt.sessionStart} - ${receipt.sessionEnd}</p>
              <p><strong>Total Paid:</strong> ₹${receipt.totalPaid}</p>
              <p><strong>Total Due:</strong> ₹${receipt.totalDue}</p>
              <p><strong>Payment Method:</strong> ${receipt.paymentMethod}</p>
              <p><strong>Date:</strong> ${new Date(receipt.paymentDate).toLocaleDateString()}</p>
            </div>
            ${receipt.monthlyPayments && receipt.monthlyPayments.length > 0 ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Date</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${receipt.monthlyPayments.map(payment => `
                  <tr>
                    <td>${payment.month}</td>
                    <td>${payment.date}</td>
                    <td>₹${payment.paid}</td>
                    <td>₹${payment.due}</td>
                    <td>${payment.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}
          </div>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `);
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