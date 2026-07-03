import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { getSessionToken } from '../utils/sessionAuth';

const AccountantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [fines, setFines] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedFine, setSelectedFine] = useState(null);
  const [reconciliationOverview, setReconciliationOverview] = useState(null);
  const [varianceAlerts, setVarianceAlerts] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      if (error.response?.status === 401) navigate('/login');
      setError('Unable to load dashboard summary right now. Showing available data.');
    }
  }, [navigate]);

  const fetchFines = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/judge-dashboard-extended/accountant/fines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFines(response.data.data.fines);
    } catch (error) {
      console.error('Error fetching fines:', error);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/payment-portal/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.data?.recentPayments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  const fetchReconciliationOverview = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/dashboard/accountant/reconciliation-overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReconciliationOverview(response.data.data || null);
    } catch (error) {
      console.error('Error fetching reconciliation overview:', error);
    }
  }, []);

  const fetchVarianceAlerts = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/dashboard/accountant/variance-alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVarianceAlerts(response.data.data?.alerts || []);
    } catch (error) {
      console.error('Error fetching variance alerts:', error);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.allSettled([fetchDashboardData(), fetchFines(), fetchPayments(), fetchReconciliationOverview(), fetchVarianceAlerts()]);
      setLoading(false);
    };

    loadAll();
  }, [fetchDashboardData, fetchFines, fetchPayments, fetchReconciliationOverview, fetchVarianceAlerts]);

  const handleUpdateFineStatus = async (fineId, status) => {
    try {
      const token = getSessionToken();
      await axios.put(
        `/api/judge-dashboard-extended/accountant/fines/${fineId}`,
        { status, paymentReceiptNumber: selectedFine?.paymentReceiptNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFines();
      setSelectedFine(null);
      alert(`Fine status updated to ${status}`);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const getTotalPendingFines = () => {
    return fines.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);
  };

  const getTotalPaidFines = () => {
    return fines.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>💰 Accountant Dashboard</h1>
          <p>{dashboardData?.accountant?.name || 'Accountant'} | {dashboardData?.accountant?.court || ''} | {dashboardData?.accountant?.state || ''}</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'fines' ? 'tab active' : 'tab'} onClick={() => setActiveTab('fines')}>Judge Fines</button>
        <button className={activeTab === 'payments' ? 'tab active' : 'tab'} onClick={() => setActiveTab('payments')}>Payments</button>
        <button className={activeTab === 'reports' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reports')}>Reports</button>
        <button className={activeTab === 'reconciliation' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reconciliation')}>Reconciliation Alerts</button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <p className="stat-number">₦{(dashboardData?.revenue?.total || 0).toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Fines</h3>
                <p className="stat-number">₦{getTotalPendingFines().toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>Paid Fines</h3>
                <p className="stat-number">₦{getTotalPaidFines().toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>Today's Collections</h3>
                <p className="stat-number">₦{(dashboardData?.revenue?.todaysRevenue || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <button onClick={() => setActiveTab('fines')} className="action-btn primary">Manage Fines</button>
              <button onClick={() => setActiveTab('payments')} className="action-btn">View Payments</button>
              <button onClick={() => setActiveTab('reports')} className="action-btn">Generate Report</button>
            </div>
          </div>
        )}

        {activeTab === 'fines' && (
          <div className="fines-section">
            <h2>Fines Imposed by Judges</h2>
            <div className="fines-summary">
              <div className="summary-card">
                <h4>Total Fines</h4>
                <p>₦{fines.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}</p>
              </div>
              <div className="summary-card pending">
                <h4>Pending</h4>
                <p>₦{getTotalPendingFines().toLocaleString()}</p>
              </div>
              <div className="summary-card paid">
                <h4>Paid</h4>
                <p>₦{getTotalPaidFines().toLocaleString()}</p>
              </div>
            </div>

            <div className="fines-table">
              {fines.length === 0 ? (
                <p>No fines recorded</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Suit No.</th>
                      <th>Imposed By</th>
                      <th>Fined Party</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fines.map(fine => (
                      <tr key={fine._id}>
                        <td>{fine.caseNumber}</td>
                        <td>{fine.suitNumber || 'N/A'}</td>
                        <td>{fine.imposedByName}</td>
                        <td>{fine.finedParty?.name} ({fine.finedParty?.role})</td>
                        <td>₦{fine.amount?.toLocaleString()}</td>
                        <td>{new Date(fine.dueDate).toLocaleDateString()}</td>
                        <td><span className={`status-badge ${fine.status.toLowerCase()}`}>{fine.status}</span></td>
                        <td>
                          {fine.status === 'Pending' && (
                            <button onClick={() => setSelectedFine(fine)} className="action-btn-sm">Update</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selectedFine && (
              <div className="modal-overlay" onClick={() => setSelectedFine(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Update Fine Status</h2>
                  <p><strong>Case:</strong> {selectedFine.caseNumber}</p>
                  <p><strong>Amount:</strong> ₦{selectedFine.amount?.toLocaleString()}</p>
                  <p><strong>Fined Party:</strong> {selectedFine.finedParty?.name}</p>
                  <div className="form-group">
                    <label>New Status:</label>
                    <select value={selectedFine.status} onChange={(e) => setSelectedFine({ ...selectedFine, status: e.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Waived">Waived</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                  {selectedFine.status === 'Paid' && (
                    <div className="form-group">
                      <label>Receipt Number:</label>
                      <input type="text" value={selectedFine.paymentReceiptNumber || ''} onChange={(e) => setSelectedFine({ ...selectedFine, paymentReceiptNumber: e.target.value })} placeholder="Enter receipt number" />
                    </div>
                  )}
                  <div className="modal-actions">
                    <button onClick={() => handleUpdateFineStatus(selectedFine._id, selectedFine.status)} className="submit-btn">Update</button>
                    <button onClick={() => setSelectedFine(null)} className="cancel-btn">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-section">
            <h2>Recent Payments</h2>
            {payments.length === 0 ? (
              <p>No payments recorded</p>
            ) : (
              <div className="payments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Receipt No.</th>
                      <th>Case</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Processed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment._id}>
                        <td>{payment.receiptNumber}</td>
                        <td>{payment.relatedCase?.caseNumber || 'N/A'}</td>
                        <td>₦{payment.amount?.toLocaleString()}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                        <td>{payment.processedBy?.firstName} {payment.processedBy?.lastName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>Financial Reports</h2>
            <div className="report-form">
              <h3>Generate Report</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                </div>
              </div>
              <button className="submit-btn">Generate Report</button>
            </div>

            <div className="report-summary">
              <h3>Financial Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <h4>Total Revenue</h4>
                  <p>₦{(dashboardData?.revenue?.total || 0).toLocaleString()}</p>
                </div>
                <div className="summary-item">
                  <h4>Pending Revenue</h4>
                  <p>₦{(dashboardData?.revenue?.pending || 0).toLocaleString()}</p>
                </div>
                <div className="summary-item">
                  <h4>Total Fines</h4>
                  <p>₦{fines.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}</p>
                </div>
                <div className="summary-item">
                  <h4>Pending Fines</h4>
                  <p>₦{getTotalPendingFines().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reconciliation' && (
          <div className="reports-section">
            <h2>Reconciliation Overview</h2>
            {reconciliationOverview ? (
              <>
                <div className="summary-grid">
                  <div className="summary-item">
                    <h4>Total Collected</h4>
                    <p>₦{Number(reconciliationOverview.summary?.totalCollected || 0).toLocaleString()}</p>
                  </div>
                  <div className="summary-item">
                    <h4>Total Banked</h4>
                    <p>₦{Number(reconciliationOverview.summary?.totalBanked || 0).toLocaleString()}</p>
                  </div>
                  <div className="summary-item">
                    <h4>Total Unbanked</h4>
                    <p>₦{Number(reconciliationOverview.summary?.totalUnbanked || 0).toLocaleString()}</p>
                  </div>
                  <div className="summary-item">
                    <h4>Total Transactions</h4>
                    <p>{Number(reconciliationOverview.summary?.totalTransactions || 0)}</p>
                  </div>
                </div>

                <div className="payments-table mt-4">
                  <table>
                    <thead>
                      <tr>
                        <th>Cashier</th>
                        <th>Collected</th>
                        <th>Banked</th>
                        <th>Unbanked</th>
                        <th>Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reconciliationOverview.cashiers || []).map((item) => (
                        <tr key={item.cashierId}>
                          <td>{item.cashierName}</td>
                          <td>₦{Number(item.totalCollected || 0).toLocaleString()}</td>
                          <td>₦{Number(item.totalBanked || 0).toLocaleString()}</td>
                          <td>₦{Number(item.totalUnbanked || 0).toLocaleString()}</td>
                          <td>{item.transactions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p>No reconciliation overview available.</p>
            )}

            <h3 className="mt-4">Variance Alerts</h3>
            {varianceAlerts.length === 0 ? (
              <p>No variance alerts found.</p>
            ) : (
              <div className="payments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Receipt</th>
                      <th>Amount</th>
                      <th>Cashier</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {varianceAlerts.map((alert, idx) => (
                      <tr key={`${alert.type}-${idx}`}>
                        <td>{alert.type}</td>
                        <td>{alert.severity}</td>
                        <td>{alert.receiptNumber || 'N/A'}</td>
                        <td>₦{Number(alert.amount || 0).toLocaleString()}</td>
                        <td>{alert.cashierName || 'N/A'}</td>
                        <td>{alert.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountantDashboard;
