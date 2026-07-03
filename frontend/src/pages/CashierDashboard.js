import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { getSessionToken } from '../utils/sessionAuth';

const formatCurrency = (value) => `N${Number(value || 0).toLocaleString()}`;

const CashierDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyReport, setDailyReport] = useState(null);
  const [reconcileDate, setReconcileDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedTotal, setExpectedTotal] = useState('');
  const [expectedTransactionCount, setExpectedTransactionCount] = useState('');
  const [reconciliationResult, setReconciliationResult] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${getSessionToken()}` }), []);

  const loadSummary = async () => {
    const response = await axios.get('/api/dashboard/cashier/summary', { headers });
    setSummary(response.data?.data || null);
  };

  const loadHistory = async () => {
    const response = await axios.get('/api/dashboard/cashier/payment-history?limit=50', { headers });
    setPayments(response.data?.data?.payments || []);
  };

  const loadDailyReport = async (date = reportDate) => {
    const response = await axios.get(`/api/dashboard/cashier/daily-report?date=${date}`, { headers });
    setDailyReport(response.data?.data?.summary || null);
  };

  const refreshDashboard = async () => {
    try {
      setError('');
      setLoading(true);
      await Promise.all([loadSummary(), loadHistory(), loadDailyReport()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load cashier dashboard data right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const togglePaymentSelection = (id) => {
    setSelectedPayments((current) =>
      current.includes(id) ? current.filter((paymentId) => paymentId !== id) : [...current, id]
    );
  };

  const markSelectedAsBanked = async () => {
    if (selectedPayments.length === 0) return;

    try {
      await axios.post(
        '/api/dashboard/cashier/mark-banked',
        { paymentIds: selectedPayments },
        { headers }
      );
      setSelectedPayments([]);
      await refreshDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to mark selected payments as banked.');
    }
  };

  const runReconciliation = async () => {
    try {
      const response = await axios.post(
        '/api/dashboard/cashier/reconcile-day',
        {
          date: reconcileDate,
          expectedTotal,
          expectedTransactionCount
        },
        { headers }
      );
      setReconciliationResult(response.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to run reconciliation.');
    }
  };

  if (loading) {
    return <div className="loading">Loading cashier dashboard...</div>;
  }

  const cashier = summary?.cashier || {};
  const stats = summary?.stats || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Cashier Dashboard</h1>
          <p>
            {cashier.name || 'Cashier'} | {cashier.court || 'No Court Set'} | {cashier.state || 'No State Set'}
          </p>
        </div>
      </header>

      {error && (
        <div className="alert alert-warning mt-3" role="alert">
          {error}
        </div>
      )}

      <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={activeTab === 'history' ? 'tab active' : 'tab'} onClick={() => setActiveTab('history')}>
          Payment History
        </button>
        <button className={activeTab === 'report' ? 'tab active' : 'tab'} onClick={() => setActiveTab('report')}>
          Daily Report
        </button>
        <button className={activeTab === 'reconcile' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reconcile')}>
          Reconciliation
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Today's Revenue</h3>
                <p className="stat-number">{formatCurrency(stats.todaysRevenue)}</p>
              </div>
              <div className="stat-card">
                <h3>Today's Transactions</h3>
                <p className="stat-number">{Number(stats.todaysCount || 0)}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Banking</h3>
                <p className="stat-number">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              <div className="stat-card">
                <h3>Total Collections</h3>
                <p className="stat-number">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <button className="action-btn primary" onClick={() => setActiveTab('history')}>
                Review Payment History
              </button>
              <button className="action-btn" onClick={() => setActiveTab('report')}>
                View Daily Report
              </button>
              <button className="action-btn" onClick={refreshDashboard}>
                Refresh Dashboard
              </button>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="payments-section">
            <h2>Recent Payments</h2>
            {payments.length === 0 ? (
              <p>No payments available yet for this cashier.</p>
            ) : (
              <div className="payments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Receipt Number</th>
                      <th>Payment Type</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Banked</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td>
                          {!payment.banked && (
                            <input
                              type="checkbox"
                              checked={selectedPayments.includes(payment._id)}
                              onChange={() => togglePaymentSelection(payment._id)}
                            />
                          )}
                        </td>
                        <td>{payment.receiptNumber || 'N/A'}</td>
                        <td>{payment.paymentType || 'N/A'}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{payment.paymentMethod || 'N/A'}</td>
                        <td>{payment.banked ? 'Yes' : 'No'}</td>
                        <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3">
              <button className="submit-btn" onClick={markSelectedAsBanked} disabled={selectedPayments.length === 0}>
                Mark Selected as Banked
              </button>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="reports-section">
            <h2>Daily Collections Report</h2>
            <div className="report-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(event) => setReportDate(event.target.value)}
                  />
                </div>
              </div>
              <button
                className="submit-btn"
                onClick={() => loadDailyReport(reportDate)}
              >
                Load Report
              </button>
            </div>

            {dailyReport && (
              <div className="report-summary mt-4">
                <h3>Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <h4>Total Transactions</h4>
                    <p>{dailyReport.totalTransactions || 0}</p>
                  </div>
                  <div className="summary-item">
                    <h4>Total Amount</h4>
                    <p>{formatCurrency(dailyReport.totalAmount)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reconcile' && (
          <div className="reports-section">
            <h2>Day Reconciliation</h2>
            <div className="report-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Reconciliation Date</label>
                  <input type="date" value={reconcileDate} onChange={(e) => setReconcileDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Expected Total (optional)</label>
                  <input type="number" value={expectedTotal} onChange={(e) => setExpectedTotal(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expected Transactions (optional)</label>
                  <input type="number" value={expectedTransactionCount} onChange={(e) => setExpectedTransactionCount(e.target.value)} placeholder="0" />
                </div>
              </div>
              <button className="submit-btn" onClick={runReconciliation}>Run Reconciliation</button>
            </div>

            {reconciliationResult && (
              <div className="report-summary mt-4">
                <h3>Reconciliation Result</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <h4>Actual Total</h4>
                    <p>{formatCurrency(reconciliationResult.summary?.actualTotal)}</p>
                  </div>
                  <div className="summary-item">
                    <h4>Unbanked</h4>
                    <p>{formatCurrency(reconciliationResult.summary?.unbankedTotal)}</p>
                  </div>
                  <div className="summary-item">
                    <h4>Variance Amount</h4>
                    <p>{formatCurrency(reconciliationResult.summary?.varianceAmount)}</p>
                  </div>
                  <div className="summary-item">
                    <h4>Variance Count</h4>
                    <p>{Number(reconciliationResult.summary?.varianceCount || 0)}</p>
                  </div>
                </div>
                {(reconciliationResult.alerts || []).length > 0 && (
                  <div className="mt-3">
                    <h4>Alerts</h4>
                    <ul>
                      {reconciliationResult.alerts.map((alert, idx) => (
                        <li key={`${alert.type}-${idx}`}>{alert.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;
