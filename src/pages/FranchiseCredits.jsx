import { useEffect, useState, useMemo } from 'react';
import API from "../api/axiosInstance";
import { FaPlus, FaHistory, FaSearch, FaSort, FaSortUp, FaSortDown, FaCoins } from 'react-icons/fa';

export default function FranchiseCredits() {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'credits', direction: 'desc' });
  
  // Add Credits Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [addForm, setAddForm] = useState({ amount: '', description: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  
  // Transaction History Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyFranchise, setHistoryFranchise] = useState(null);

  const loadFranchises = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/credits/admin/franchises');
      const data = res.data;
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setFranchises(arr);
    } catch (err) {
      console.error('load franchises error:', err);
      setError(err.userMessage || 'Failed to load franchises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFranchises();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Filter and sort franchises
  const filteredFranchises = useMemo(() => {
    let result = [...franchises];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f => 
        (f.instituteId || '').toLowerCase().includes(term) ||
        (f.instituteName || '').toLowerCase().includes(term) ||
        (f.ownerName || '').toLowerCase().includes(term)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'credits':
          aValue = Number(a.credits || 0);
          bValue = Number(b.credits || 0);
          break;
        case 'totalUsed':
          aValue = Number(a.totalUsed || 0);
          bValue = Number(b.totalUsed || 0);
          break;
        case 'name':
          aValue = (a.instituteName || '').toLowerCase();
          bValue = (b.instituteName || '').toLowerCase();
          break;
        case 'code':
          aValue = (a.instituteId || '').toLowerCase();
          bValue = (b.instituteId || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [franchises, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ms-1 text-muted" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="ms-1 text-primary" />
      : <FaSortDown className="ms-1 text-primary" />;
  };

  // Add Credits Modal handlers
  const openAddModal = (franchise) => {
    setSelectedFranchise(franchise);
    setAddForm({ amount: '', description: '' });
    setAddError('');
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedFranchise(null);
    setAddForm({ amount: '', description: '' });
    setAddError('');
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();
    if (!selectedFranchise) return;
    
    const amount = Number(addForm.amount);
    if (!amount || amount <= 0) {
      setAddError('Please enter a valid amount greater than 0');
      return;
    }
    
    if (!window.confirm(`Add ${amount} credits to ${selectedFranchise.instituteName}?`)) {
      return;
    }
    
    setAddLoading(true);
    setAddError('');
    
    try {
      await API.post('/credits/admin/add', {
        franchiseId: selectedFranchise._id,
        amount: amount,
        description: addForm.description || 'Admin credit addition'
      });
      
      // Update the franchise in the list
      setFranchises(prev => 
        prev.map(f => 
          f._id === selectedFranchise._id 
            ? { ...f, credits: (f.credits || 0) + amount }
            : f
        )
      );
      
      setSuccessMessage(`Successfully added ${amount} credits to ${selectedFranchise.instituteName}`);
      closeAddModal();
    } catch (err) {
      console.error('add credits error:', err);
      setAddError(err.userMessage || 'Failed to add credits');
    } finally {
      setAddLoading(false);
    }
  };

  // Transaction History Modal handlers
  const openHistoryModal = async (franchise) => {
    setHistoryFranchise(franchise);
    setShowHistoryModal(true);
    setCurrentPage(1);
    await loadTransactions(franchise._id, 1);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryFranchise(null);
    setTransactions([]);
    setTransactionsError('');
    setCurrentPage(1);
    setTotalPages(1);
  };

  const loadTransactions = async (franchiseId, page) => {
    setTransactionsLoading(true);
    setTransactionsError('');
    try {
      const res = await API.get(`/credits/admin/transactions/${franchiseId}?page=${page}&limit=10`);
      const data = res.data;
      setTransactions(data.transactions || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (err) {
      console.error('load transactions error:', err);
      setTransactionsError(err.userMessage || 'Failed to load transaction history');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && historyFranchise) {
      setCurrentPage(newPage);
      loadTransactions(historyFranchise._id, newPage);
    }
  };

  const getTransactionTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'topup':
      case 'credit':
        return <span className="badge bg-success">Top-up</span>;
      case 'deduction':
      case 'debit':
        return <span className="badge bg-danger">Deduction</span>;
      default:
        return <span className="badge bg-secondary">{type || 'Unknown'}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Franchise Credit Management</h2>
          <div className="small text-muted">
            Manage credits for all franchises
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={loadFranchises}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible" role="alert">
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text"><FaSearch /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by franchise code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <span className="text-muted">
                Showing {filteredFranchises.length} of {franchises.length} franchises
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Franchises Table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="mt-2">Loading franchises...</div>
            </div>
          ) : filteredFranchises.length === 0 ? (
            <div className="p-4 text-center text-muted">
              {searchTerm ? 'No franchises match your search.' : 'No franchises found.'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('code')}
                    >
                      Franchise Code {getSortIcon('code')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('name')}
                    >
                      Name {getSortIcon('name')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('credits')}
                    >
                      Current Credits {getSortIcon('credits')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('totalUsed')}
                    >
                      Total Used {getSortIcon('totalUsed')}
                    </th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFranchises.map((f) => (
                    <tr key={f._id}>
                      <td>
                        <span className="font-monospace fw-semibold">{f.instituteId || '-'}</span>
                      </td>
                      <td>
                        <div className="fw-semibold">{f.instituteName || 'Unknown'}</div>
                        <div className="small text-muted">{f.ownerName || ''}</div>
                      </td>
                      <td>
                        <span className={`badge fs-6 ${(f.credits || 0) > 0 ? 'bg-success' : 'bg-secondary'}`}>
                          <FaCoins className="me-1" />
                          {Number(f.credits || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">
                          {Number(f.totalUsed || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => openAddModal(f)}
                          title="Add Credits"
                        >
                          <FaPlus className="me-1" />
                          Add Credits
                        </button>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => openHistoryModal(f)}
                          title="View Transaction History"
                        >
                          <FaHistory className="me-1" />
                          History
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

      {/* Add Credits Modal */}
      {showAddModal && selectedFranchise && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <form onSubmit={handleAddCredits}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaCoins className="me-2 text-warning" />
                    Add Credits
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeAddModal}
                  />
                </div>
                <div className="modal-body">
                  {addError && (
                    <div className="alert alert-danger" role="alert">
                      {addError}
                    </div>
                  )}
                  
                  {/* Current Credits Info */}
                  <div className="alert alert-info mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted">Franchise</div>
                        <div className="fw-semibold">{selectedFranchise.instituteName}</div>
                        <div className="small text-muted">{selectedFranchise.instituteId}</div>
                      </div>
                      <div className="text-end">
                        <div className="small text-muted">Current Credits</div>
                        <div className="fs-4 fw-bold text-success">
                          {Number(selectedFranchise.credits || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Amount to Add <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      name="amount"
                      value={addForm.amount}
                      onChange={handleAddFormChange}
                      placeholder="Enter credit amount"
                      min="1"
                      required
                      autoFocus
                    />
                    <div className="form-text">
                      New balance will be: {' '}
                      <strong>
                        {(Number(selectedFranchise.credits || 0) + Number(addForm.amount || 0)).toLocaleString()} credits
                      </strong>
                    </div>
                  </div>

                  {/* Description Input */}
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={addForm.description}
                      onChange={handleAddFormChange}
                      placeholder="Enter description (optional)"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeAddModal}
                    disabled={addLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addLoading || !addForm.amount}
                  >
                    {addLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-1" />
                        Add Credits
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showHistoryModal && historyFranchise && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FaHistory className="me-2" />
                  Transaction History
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeHistoryModal}
                />
              </div>
              <div className="modal-body">
                {/* Franchise Info */}
                <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                  <div>
                    <div className="fw-semibold">{historyFranchise.instituteName}</div>
                    <div className="small text-muted">{historyFranchise.instituteId}</div>
                  </div>
                  <div className="text-end">
                    <div className="small text-muted">Current Balance</div>
                    <div className="fs-5 fw-bold text-success">
                      {Number(historyFranchise.credits || 0).toLocaleString()} credits
                    </div>
                  </div>
                </div>

                {transactionsError && (
                  <div className="alert alert-danger" role="alert">
                    {transactionsError}
                  </div>
                )}

                {transactionsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="mt-2">Loading transactions...</div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <FaHistory size={48} className="mb-3 text-muted" />
                    <p>No transactions found for this franchise.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-sm table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((t) => (
                            <tr key={t._id}>
                              <td className="text-nowrap">{formatDate(t.createdAt)}</td>
                              <td>{getTransactionTypeBadge(t.type)}</td>
                              <td>
                                <span className={t.type === 'topup' || t.type === 'credit' ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                                  {t.type === 'topup' || t.type === 'credit' ? '+' : '-'}
                                  {Number(t.amount || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="small">{t.description || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <nav aria-label="Transaction pagination" className="mt-3">
                        <ul className="pagination justify-content-center">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <li 
                              key={page} 
                              className={`page-item ${currentPage === page ? 'active' : ''}`}
                            >
                              <button 
                                className="page-link" 
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeHistoryModal}
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
