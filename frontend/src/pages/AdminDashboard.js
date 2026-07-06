import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getSessionToken } from '../utils/sessionAuth';
import './AdminDashboard.css';

const API_BASE = '/api';

// Classify an axios error into a user-facing message.
// 401 / 403 are access errors — show them distinctly so the user
// knows the page exists but they are not authorised to use it.
function apiErrorMessage(err, fallback) {
  const status = err?.response?.status;
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'Access denied. This panel requires administrator credentials.';
  return err?.response?.data?.message || fallback;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('onboarding');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState([]);
  const [paymentIssues, setPaymentIssues] = useState([]);
  const [reportedIssues, setReportedIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    state: '',
    lga: '',
    department: '',
    court: ''
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIsolateModal, setShowIsolateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPaymentIssue, setSelectedPaymentIssue] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'clerk',
    state: '',
    court: '',
    department: '',
    phoneNumber: ''
  });

  const [isolateForm, setIsolateForm] = useState({
    reason: 'Suspected compromised login or device/browser mismatch'
  });

  const [paymentForm, setPaymentForm] = useState({
    status: 'pending',
    note: ''
  });

  const token = getSessionToken();
  const apiHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const normalizedFilters = useMemo(() => Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  ), [filters]);

  const hasOnboardingCriteria = useMemo(
    () => Object.values(normalizedFilters).some(Boolean),
    [normalizedFilters]
  );

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      state: '',
      lga: '',
      department: '',
      court: ''
    });
    setShowMobileFilters(false);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'Not available');

  // Fetch functions
  const fetchUsers = useCallback(async () => {
    if (!Object.values(normalizedFilters).some(Boolean)) {
      setUsers([]);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams(
        Object.entries(normalizedFilters).filter(([, value]) => Boolean(value))
      ).toString();
      const endpoint = query ? `${API_BASE}/admin/users?${query}` : `${API_BASE}/admin/users`;
      const res = await axios.get(endpoint, { headers: apiHeaders });
      setUsers(res.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to fetch users'));
    } finally {
      setLoading(false);
    }
  }, [apiHeaders, normalizedFilters]);

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/admin/users/pending-confirmations`, { headers: apiHeaders });
      setPendingUsers(res.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to fetch pending users'));
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

  const fetchSuspiciousUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/admin/users/suspicious`, { headers: apiHeaders });
      setSuspiciousUsers(res.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to fetch suspicious users'));
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

  const fetchPaymentIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/admin/users`, { headers: apiHeaders });
      const issues = (res.data.data || []).filter(u => u.paymentIssueStatus && u.paymentIssueStatus !== 'resolved');
      setPaymentIssues(issues);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to fetch payment issues'));
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

  const fetchReportedIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/admin/issues`, { headers: apiHeaders });
      setReportedIssues(res.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to fetch reported issues'));
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

  // Action handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/admin/users/manual-create`, createForm, { headers: apiHeaders });
      setSuccess(`✅ User ${res.data.data.firstName} created | Staff ID: ${res.data.data.staffId}`);
      setCreateForm({
        firstName: '', lastName: '', email: '', password: '',
        role: 'clerk', state: '', court: '', department: '', phoneNumber: ''
      });
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      setError('❌ ' + apiErrorMessage(err, 'Failed to create user'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAccount = async (userId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/users/${userId}/confirm`, {}, { headers: apiHeaders });
      setSuccess(`✅ Account confirmed for ${res.data.data.firstName}`);
      fetchPendingUsers();
      fetchUsers();
    } catch (err) {
      setError('❌ ' + apiErrorMessage(err, 'Failed to confirm account'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCredentials = async (userId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/users/${userId}/generate-credentials`, { force: true }, { headers: apiHeaders });
      setSuccess(`✅ Staff ID: ${res.data.data.staffId} | Recovery Code: ${res.data.data.offlineRecoveryCode}`);
      fetchUsers();
    } catch (err) {
      setError('❌ ' + apiErrorMessage(err, 'Failed to generate credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStaffId = async (userId) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/admin/users/${userId}/approve-staff-id`, {}, { headers: apiHeaders });
      setSuccess('✅ Staff ID request approved');
      fetchUsers();
    } catch (err) {
      setError('❌ ' + apiErrorMessage(err, 'Failed to approve staff ID'));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectStaffId = async (userId) => {
    const reason = window.prompt('Reason for rejecting this Staff ID request:');
    if (reason === null) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/admin/users/${userId}/reject-staff-id`, { reason }, { headers: apiHeaders });
      setSuccess('✅ Staff ID request rejected');
      fetchUsers();
    } catch (err) {
      setError('❌ ' + apiErrorMessage(err, 'Failed to reject staff ID'));
    } finally {
      setLoading(false);
    }
  };

  const handleIsolateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.patch(`${API_BASE}/admin/users/${selectedUser.id}/isolate`, isolateForm, { headers: apiHeaders });
      setSuccess(`⚠️ Account isolated for ${res.data.data.firstName}`);
      fetchSuspiciousUsers();
      fetchUsers();
      setShowIsolateModal(false);
    } catch (err) {
      setError('❌ ' + apiErrorMessage(err, 'Failed to isolate account'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('⚠️ Are you sure? This cannot be undone.')) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE}/admin/users/${userId}`, { headers: apiHeaders });
        setSuccess('✅ User deleted');
        fetchUsers();
      } catch (err) {
        setError('❌ ' + apiErrorMessage(err, 'Failed to delete user'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdatePaymentIssue = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch(`${API_BASE}/admin/users/${selectedPaymentIssue.id}/payment-issue`, {
        paymentIssueStatus: paymentForm.status,
        paymentIssueNote: paymentForm.note
      }, { headers: apiHeaders });
      setSuccess(`✅ Payment issue updated for ${selectedPaymentIssue.firstName}`);
      fetchPaymentIssues();
      setShowPaymentModal(false);
      setPaymentForm({ status: 'pending', note: '' });
    } catch (err) {
      setError('❌ ' + apiErrorMessage(err, 'Failed to update payment issue'));
    } finally {
      setLoading(false);
    }
  };

  const handleResolveOrEscalateIssue = async (issue, escalateToTech = false) => {
    setLoading(true);
    try {
      await axios.patch(`${API_BASE}/admin/users/${issue.userId}/payment-issue`, {
        paymentIssueStatus: escalateToTech ? 'investigating' : 'resolved',
        paymentIssueNote: escalateToTech
          ? `Escalated to tech: ${issue.note || issue.message || 'Reported issue'}`
          : `Resolved by admin: ${issue.note || issue.message || 'Reported issue'}`,
        escalateToTech,
        category: issue.type || 'general',
        issueId: issue.issueId
      }, { headers: apiHeaders });
      setSuccess(escalateToTech ? '✅ Issue escalated to tech' : '✅ Issue resolved');
      fetchReportedIssues();
      fetchPaymentIssues();
    } catch (err) {
      setError('❌ ' + apiErrorMessage(err, 'Failed to update issue'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'onboarding') {
      if (hasOnboardingCriteria) {
        fetchUsers();
      } else {
        setUsers([]);
      }
    }
    if (activeTab === 'pending') fetchPendingUsers();
    if (activeTab === 'security') fetchSuspiciousUsers();
    if (activeTab === 'payments') fetchPaymentIssues();
    if (activeTab === 'issues') fetchReportedIssues();
  }, [activeTab, fetchPaymentIssues, fetchPendingUsers, fetchReportedIssues, fetchSuspiciousUsers, fetchUsers, hasOnboardingCriteria]);

  useEffect(() => {
    if (activeTab !== 'onboarding') {
      return;
    }

    if (!hasOnboardingCriteria) {
      setUsers([]);
      setLoading(false);
      setError('');
      return;
    }

    fetchUsers();
  }, [activeTab, fetchUsers, hasOnboardingCriteria]);

  return (
    <div className="admin-dashboard-page min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-nba-dark rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">🔐</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-nba-dark">Administrator Control Panel</h1>
              <p className="text-gray-600">Manage users, confirm accounts, generate credentials, and monitor security</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 text-red-900 fade-in rounded">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-600 hover:text-red-800 font-bold">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-600 text-green-900 fade-in rounded">
            {success}
            <button onClick={() => setSuccess('')} className="ml-4 text-green-600 hover:text-green-800 font-bold">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="nba-card overflow-hidden">
          <div className="flex border-b border-gray-200 bg-transparent overflow-x-auto">
            {[
              { id: 'onboarding', label: 'Onboarding', icon: '👤' },
              { id: 'pending', label: 'Pending', icon: '⏳' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'payments', label: 'Payments', icon: '💳' },
              { id: 'issues', label: 'Issues', icon: '🛠️' }
            ].map((tab) => {
              const counts = { 
                onboarding: users.length, 
                pending: pendingUsers.length, 
                security: suspiciousUsers.length,
                payments: paymentIssues.length,
                issues: reportedIssues.length
              };
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-semibold text-center border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-nba-dark text-nba-dark bg-gray-50' 
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}>
                  {tab.icon} {tab.label} <span className="ml-2 bg-nba-dark text-white rounded-full px-2 py-0.5 text-sm">{counts[tab.id]}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="nba-card-body">
            {activeTab === 'onboarding' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">👤 Judge/Staff Onboarding</h3>
                    <p className="text-gray-600">Create accounts, generate staff IDs, and assign roles</p>
                  </div>
                  <button onClick={() => setShowCreateModal(true)} className="nba-btn-primary">+ Create User</button>
                </div>
                <div className="admin-controls-card">
                  <div className="admin-search-row">
                    <input
                      className="form-control admin-search-input"
                      placeholder="Search by name, email, role or staff ID"
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary admin-mobile-toggle"
                      onClick={() => setShowMobileFilters((prev) => !prev)}
                    >
                      {showMobileFilters ? 'Hide filters' : 'Show filters'}
                    </button>
                  </div>
                  <div className={`admin-filter-grid ${showMobileFilters ? 'is-open' : ''}`}>
                    <input className="form-control" placeholder="Role" value={filters.role} onChange={(e) => updateFilter('role', e.target.value)} />
                    <input className="form-control" placeholder="State" value={filters.state} onChange={(e) => updateFilter('state', e.target.value)} />
                    <input className="form-control" placeholder="LGA" value={filters.lga} onChange={(e) => updateFilter('lga', e.target.value)} />
                    <input className="form-control" placeholder="Department" value={filters.department} onChange={(e) => updateFilter('department', e.target.value)} />
                    <input className="form-control" placeholder="Court" value={filters.court} onChange={(e) => updateFilter('court', e.target.value)} />
                  </div>
                  {hasActiveFilters && (
                    <div className="admin-filter-actions">
                      <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>Clear search and filters</button>
                    </div>
                  )}
                </div>
                {loading ? (
                  <div className="text-center py-8"><span className="text-gray-600">Loading users...</span></div>
                ) : users.length > 0 ? (
                  <>
                  <div className="overflow-x-auto admin-desktop-table">
                    <table className="nba-table">
                      <thead>
                        <tr className="bg-gray-100 text-gray-900">
                          <th>Name</th><th>Email</th><th>Role</th><th>State/LGA/Court</th><th>Staff ID</th><th>Status</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>{users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-200">
                          <td className="px-4 py-3 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                          <td className="px-4 py-3 text-gray-700 text-sm">{user.email}</td>
                          <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-sm font-medium">{user.role}</span></td>
                          <td className="px-4 py-3 text-gray-700 text-sm">{user.state || '-'} / {user.lga || '-'} {user.court ? `/ ${user.court}` : ''}</td>
                          <td className="px-4 py-3"><code className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded">{user.staffId || user.pendingStaffId || '❌'}</code></td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${user.isVerified ? 'bg-green-600' : 'bg-yellow-600'}`}>
                              {user.staffIdRequestStatus === 'pending_approval' ? '⏳ Staff ID Pending' : (user.isVerified ? '✓ Verified' : '⏳ Pending')}
                            </span>
                          </td>
                          <td className="px-4 py-3 space-x-1">
                            <button onClick={() => openUserModal(user)} className="nba-btn-primary text-sm px-2 py-1">Details</button>
                            {!user.staffId && <button onClick={() => handleGenerateCredentials(user.id)} className="nba-btn text-sm px-2 py-1 bg-blue-600 text-white hover:bg-blue-700">Gen ID</button>}
                            {user.staffIdRequestStatus === 'pending_approval' && <button onClick={() => handleApproveStaffId(user.id)} className="nba-btn text-sm px-2 py-1 bg-green-700 text-white">Approve ID</button>}
                            {user.staffIdRequestStatus === 'pending_approval' && <button onClick={() => handleRejectStaffId(user.id)} className="nba-btn text-sm px-2 py-1 bg-red-700 text-white">Reject ID</button>}
                            <button onClick={() => handleDeleteUser(user.id)} className="nba-btn text-sm px-2 py-1 bg-gray-700 text-white hover:bg-gray-800">Delete</button>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="admin-user-card-list">
                    {users.map((user) => (
                      <article key={user.id} className="admin-user-card">
                        <div className="admin-user-card-header">
                          <div>
                            <h4 className="admin-user-card-title">{user.firstName} {user.lastName}</h4>
                            <p className="admin-user-card-email">{user.email}</p>
                          </div>
                          <span className="admin-status-code">{user.role}</span>
                        </div>
                        <div className="admin-user-card-grid">
                          <div>
                            <span>Status</span>
                            <strong>{user.staffIdRequestStatus === 'pending_approval' ? 'Staff ID Pending' : (user.isVerified ? 'Verified' : 'Pending')}</strong>
                          </div>
                          <div>
                            <span>Staff ID</span>
                            <code>{user.staffId || user.pendingStaffId || 'Not generated'}</code>
                          </div>
                          <div>
                            <span>Location</span>
                            <strong>{user.state || '-'} {user.lga ? `/ ${user.lga}` : ''}</strong>
                          </div>
                          <div>
                            <span>Court</span>
                            <strong>{user.court || '-'}</strong>
                          </div>
                        </div>
                        <div className="admin-user-card-actions">
                          <button onClick={() => openUserModal(user)} className="nba-btn-primary text-sm px-2 py-1">Details</button>
                          {!user.staffId && <button onClick={() => handleGenerateCredentials(user.id)} className="nba-btn text-sm px-2 py-1 bg-blue-600 text-white hover:bg-blue-700">Gen ID</button>}
                          {user.staffIdRequestStatus === 'pending_approval' && <button onClick={() => handleApproveStaffId(user.id)} className="nba-btn text-sm px-2 py-1 bg-green-700 text-white">Approve ID</button>}
                          {user.staffIdRequestStatus === 'pending_approval' && <button onClick={() => handleRejectStaffId(user.id)} className="nba-btn text-sm px-2 py-1 bg-red-700 text-white">Reject ID</button>}
                          <button onClick={() => handleDeleteUser(user.id)} className="nba-btn text-sm px-2 py-1 bg-gray-700 text-white hover:bg-gray-800">Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                  </>
                ) : hasOnboardingCriteria ? (
                  <div className="text-center py-8 text-gray-600">No onboarded users matched the current search or filters.</div>
                ) : (
                  <div className="text-center py-8 text-gray-600">Enter a search query or filter first to load onboarded users.</div>
                )}
              </div>
            )}

            {activeTab === 'issues' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reported Issues and Escalations</h3>
                {loading ? (
                  <div className="text-center py-8"><span className="text-gray-600">Loading...</span></div>
                ) : reportedIssues.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="nba-table">
                      <thead>
                        <tr className="bg-gray-100 text-gray-900">
                          <th>User</th><th>Role</th><th>Category</th><th>Message</th><th>Location</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportedIssues.map((issue) => (
                          <tr key={issue.issueId} className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-4 py-3 text-gray-900">{issue.userName || issue.userEmail}</td>
                            <td className="px-4 py-3 text-gray-700">{issue.role || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{issue.type || 'general'}</td>
                            <td className="px-4 py-3 text-gray-700">{issue.note || issue.message || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{issue.state || '-'} / {issue.lga || '-'}</td>
                            <td className="px-4 py-3 space-x-2">
                              <button onClick={() => handleResolveOrEscalateIssue(issue, false)} className="nba-btn-success px-3 py-1 text-sm">Resolve</button>
                              <button onClick={() => handleResolveOrEscalateIssue(issue, true)} className="nba-btn text-sm px-3 py-1 bg-indigo-700 text-white">Escalate Tech</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">No reported issues yet</div>
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Account Confirmations Pending</h3>
                {loading ? (
                  <div className="text-center py-8"><span className="text-gray-600">Loading...</span></div>
                ) : pendingUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="nba-table">
                      <thead>
                        <tr className="bg-gray-100 text-gray-900">
                          <th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-4 py-3 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                            <td className="px-4 py-3 text-gray-700">{user.email}</td>
                            <td className="px-4 py-3 text-gray-700">{user.role}</td>
                            <td className="px-4 py-3 text-gray-700">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 space-x-2">
                              <button onClick={() => handleConfirmAccount(user.id)} className="nba-btn-success px-3 py-1 text-sm">✓ Confirm</button>
                              <button onClick={() => handleDeleteUser(user.id)} className="nba-btn text-sm px-3 py-1 bg-gray-700 text-white hover:bg-gray-800">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">No pending confirmations</div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🔒 Security & Compromised Accounts</h3>
                  <p className="text-gray-600 mb-4">Monitor suspicious login events and account compromise risks</p>
                </div>
                {loading ? (
                  <div className="text-center py-8"><span className="text-gray-600">Loading...</span></div>
                ) : suspiciousUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="nba-table">
                      <thead>
                        <tr className="bg-gray-100 text-gray-900">
                          <th>Name</th><th>Email</th><th>Risk Score</th><th>Device Change</th><th>IP Mismatch</th><th>Last IP</th><th>Last Activity</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suspiciousUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-4 py-3 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                            <td className="px-4 py-3 text-gray-700 text-sm">{user.email}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-3 py-1 rounded text-white text-sm font-bold ${(user.emailVerificationRisk?.score || 0) >= 60 ? 'bg-red-600' : (user.emailVerificationRisk?.score || 0) >= 40 ? 'bg-orange-600' : 'bg-yellow-600'}`}>
                                {user.emailVerificationRisk?.score || 0}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{user.emailVerificationRisk?.signals?.deviceChange ? '🔴 Detected' : '🟢 No'}</td>
                            <td className="px-4 py-3 text-sm">{user.emailVerificationRisk?.signals?.ipGeoMismatch ? '🔴 Detected' : '🟢 No'}</td>
                            <td className="px-4 py-3 text-xs font-mono bg-gray-100 text-gray-900 px-2 py-1 rounded">{user.lastLoginIp || '-'}</td>
                            <td className="px-4 py-3 text-sm">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3 space-x-1">
                              <button onClick={() => { setSelectedUser(user); setShowIsolateModal(true); }} className="nba-btn-danger text-sm px-2 py-1">Isolate</button>
                              <button onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="nba-btn-primary text-sm px-2 py-1">Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-green-700 bg-green-50 rounded">✅ No suspicious accounts detected</div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">💳 Payment Issues & Verification</h3>
                  <p className="text-gray-600 mb-4">Track and resolve payment verification problems requiring follow-up</p>
                </div>
                {loading ? (
                  <div className="text-center py-8"><span className="text-gray-600">Loading...</span></div>
                ) : paymentIssues.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="nba-table">
                      <thead>
                        <tr className="bg-gray-100 text-gray-900">
                          <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Notes</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentIssues.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-4 py-3 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                            <td className="px-4 py-3 text-gray-700 text-sm">{user.email}</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-purple-100 text-purple-900 rounded text-sm font-medium">{user.role}</span></td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${
                                user.paymentIssueStatus === 'resolved' ? 'bg-green-600' :
                                user.paymentIssueStatus === 'escalated' ? 'bg-red-600' :
                                user.paymentIssueStatus === 'flagged' ? 'bg-orange-600' :
                                'bg-yellow-600'
                              }`}>
                                {user.paymentIssueStatus || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{user.paymentIssueNotes ? (typeof user.paymentIssueNotes === 'string' ? user.paymentIssueNotes : user.paymentIssueNotes[0]?.note || '-') : '-'}</td>
                            <td className="px-4 py-3 space-x-1">
                              <button onClick={() => { setSelectedPaymentIssue(user); setPaymentForm({ status: user.paymentIssueStatus || 'pending', note: '' }); setShowPaymentModal(true); }} className="nba-btn-primary text-sm px-2 py-1">Update</button>
                              <button onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="nba-btn text-sm px-2 py-1 bg-blue-600 text-white hover:bg-blue-700">Info</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-green-700 bg-green-50 rounded">✅ No payment issues to resolve</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="nba-card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="nba-card-header flex justify-between items-center">
              <h2 className="text-xl">User Details: {selectedUser.firstName} {selectedUser.lastName}</h2>
              <button onClick={() => setShowUserModal(false)} className="text-white hover:text-gray-200 text-2xl">✕</button>
            </div>
            <div className="nba-card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-600"><strong>Email:</strong></p><p className="text-gray-900">{selectedUser.email}</p></div>
                <div><p className="text-gray-600"><strong>Role:</strong></p><p className="text-gray-900">{selectedUser.role}</p></div>
                <div><p className="text-gray-600"><strong>Department:</strong></p><p className="text-gray-900">{selectedUser.department || '-'}</p></div>
                <div><p className="text-gray-600"><strong>State:</strong></p><p className="text-gray-900">{selectedUser.state || '-'}</p></div>
                <div><p className="text-gray-600"><strong>Status:</strong></p><p className="text-gray-900"><span className={`px-3 py-1 rounded text-white text-sm ${selectedUser.isActive ? 'bg-green-600' : 'bg-red-600'}`}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span></p></div>
                <div><p className="text-gray-600"><strong>Verified:</strong></p><p className="text-gray-900"><span className={`px-3 py-1 rounded text-white text-sm ${selectedUser.isVerified ? 'bg-green-600' : 'bg-yellow-600'}`}>{selectedUser.isVerified ? 'Yes' : 'No'}</span></p></div>
                <div><p className="text-gray-600"><strong>Account Created:</strong></p><p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p></div>
                <div><p className="text-gray-600"><strong>Account Type:</strong></p><p className="text-gray-900">{selectedUser.role === 'admin' ? 'Administrator' : selectedUser.role === 'judge' ? 'Judicial officer' : 'Court staff'}</p></div>
              </div>
              <hr className="border-gray-200" />
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-600"><strong>Staff ID:</strong></p><p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">{selectedUser.staffId || 'Not generated'}</p></div>
                <div><p className="text-gray-600"><strong>Recovery Code:</strong></p><p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">{selectedUser.offlineRecoveryCode ? selectedUser.offlineRecoveryCode.slice(0, 8) + '***' : 'Not set'}</p></div>
                <div><p className="text-gray-600"><strong>Last Login IP:</strong></p><p className="text-gray-900 font-mono text-sm">{selectedUser.lastLoginIp || '-'}</p></div>
                <div><p className="text-gray-600"><strong>Risk Score:</strong></p><p className="text-gray-900 font-bold">{selectedUser.emailVerificationRisk?.score || 0}%</p></div>
              </div>
              {selectedUser.compromiseReason && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
                  <p className="text-yellow-900 font-bold">⚠️ Compromise Reason</p>
                  <p className="text-yellow-800">{selectedUser.compromiseReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="nba-card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="nba-card-header flex justify-between items-center">
              <h2 className="text-xl">Create User (Admin Onboarding)</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-white hover:text-gray-200 text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="nba-card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="First Name" required value={createForm.firstName} onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})} className="nba-input" />
                <input type="text" placeholder="Last Name" required value={createForm.lastName} onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})} className="nba-input" />
                <input type="email" placeholder="Email" required value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} className="nba-input col-span-2" />
                <input type="password" placeholder="Password" required value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})} className="nba-input col-span-2" />
                <select value={createForm.role} onChange={(e) => setCreateForm({...createForm, role: e.target.value})} className="nba-input">
                  <option value="clerk">Clerk</option><option value="judge">Judge</option><option value="registrar">Registrar</option>
                  <option value="accountant">Accountant</option><option value="bailiff">Bailiff</option><option value="secretary">Secretary</option>
                </select>
                <input type="text" placeholder="State" value={createForm.state} onChange={(e) => setCreateForm({...createForm, state: e.target.value})} className="nba-input" />
                <input type="text" placeholder="Court" value={createForm.court} onChange={(e) => setCreateForm({...createForm, court: e.target.value})} className="nba-input" />
                <input type="text" placeholder="Department" value={createForm.department} onChange={(e) => setCreateForm({...createForm, department: e.target.value})} className="nba-input" />
                <input type="tel" placeholder="Phone" value={createForm.phoneNumber} onChange={(e) => setCreateForm({...createForm, phoneNumber: e.target.value})} className="nba-input" />
              </div>
              <button type="submit" disabled={loading} className="w-full nba-btn-primary">
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Isolate Modal */}
      {showIsolateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="nba-card max-w-lg w-full mx-4">
            <div className="nba-card-header">Isolate Account: {selectedUser.firstName} {selectedUser.lastName}</div>
            <form onSubmit={handleIsolateAccount} className="nba-card-body space-y-4">
              <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-900 rounded">
                ⚠️ This will deactivate the account and prevent login.
              </div>
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Isolation Reason</label>
                <textarea rows="3" value={isolateForm.reason} onChange={(e) => setIsolateForm({...isolateForm, reason: e.target.value})} className="nba-input text-gray-900" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 nba-btn-danger">
                  {loading ? 'Isolating...' : 'Isolate Account'}
                </button>
                <button type="button" onClick={() => setShowIsolateModal(false)} className="flex-1 nba-btn bg-gray-300 text-gray-900 hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Issue Modal */}
      {showPaymentModal && selectedPaymentIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="nba-card max-w-lg w-full mx-4">
            <div className="nba-card-header">Payment Issue: {selectedPaymentIssue.firstName} {selectedPaymentIssue.lastName}</div>
            <form onSubmit={handleUpdatePaymentIssue} className="nba-card-body space-y-4">
              <div className="space-y-2">
                <p className="text-gray-700"><strong>Email:</strong> {selectedPaymentIssue.email}</p>
                <p className="text-gray-700"><strong>Current Status:</strong> <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${
                  selectedPaymentIssue.paymentIssueStatus === 'resolved' ? 'bg-green-600' :
                  selectedPaymentIssue.paymentIssueStatus === 'escalated' ? 'bg-red-600' :
                  selectedPaymentIssue.paymentIssueStatus === 'flagged' ? 'bg-orange-600' :
                  'bg-yellow-600'
                }`}>{selectedPaymentIssue.paymentIssueStatus || 'pending'}</span></p>
              </div>
              <hr className="border-gray-200" />
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Update Status</label>
                <select value={paymentForm.status} onChange={(e) => setPaymentForm({...paymentForm, status: e.target.value})} className="nba-input text-gray-900">
                  <option value="pending">⏳ Pending Review</option>
                  <option value="flagged">🚩 Flag for Accountant</option>
                  <option value="escalated">🔴 Escalate to Dev Support</option>
                  <option value="resolved">✅ Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Notes</label>
                <textarea rows="3" placeholder="Add notes about this payment issue..." value={paymentForm.note} onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})} className="nba-input text-gray-900" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 nba-btn-primary">
                  {loading ? 'Updating...' : 'Update Issue'}
                </button>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 nba-btn bg-gray-300 text-gray-900 hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
