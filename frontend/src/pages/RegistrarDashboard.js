import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { getSessionToken } from '../utils/sessionAuth';

const RegistrarDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [cases, setCases] = useState([]);
  const [availableJudges, setAvailableJudges] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [, setShowRegisterModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingTime, setHearingTime] = useState('09:00');
  const [validationResult, setValidationResult] = useState(null);
  const [slotSuggestions, setSlotSuggestions] = useState([]);
  const [validatingSchedule, setValidatingSchedule] = useState(false);

  const [newCase, setNewCase] = useState({
    title: '',
    caseType: 'Civil',
    plaintiff: { name: '', address: '', phoneNumber: '', email: '', lawyer: { name: '', email: '', phoneNumber: '' } },
    defendant: { name: '', address: '', phoneNumber: '', email: '', lawyer: { name: '', email: '', phoneNumber: '' } },
    description: ''
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/registrar-dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const fetchPendingCases = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/registrar-dashboard/pending-cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCases(response.data.data.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  }, []);

  const fetchAvailableJudges = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/registrar-dashboard/available-judges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableJudges(response.data.data.judges);
    } catch (error) {
      console.error('Error fetching judges:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingCases();
    fetchAvailableJudges();
  }, [fetchAvailableJudges, fetchDashboardData, fetchPendingCases]);

  const handleRegisterCase = async (e) => {
    e.preventDefault();
    try {
      const token = getSessionToken();
      await axios.post('/api/registrar-dashboard/register-case', newCase, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Case registered successfully!');
      setShowRegisterModal(false);
      fetchDashboardData();
      fetchPendingCases();
      setNewCase({
        title: '',
        caseType: 'Civil',
        plaintiff: { name: '', address: '', phoneNumber: '', email: '', lawyer: { name: '', email: '', phoneNumber: '' } },
        defendant: { name: '', address: '', phoneNumber: '', email: '', lawyer: { name: '', email: '', phoneNumber: '' } },
        description: ''
      });
    } catch (error) {
      alert('Error registering case: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleValidateSchedule = async () => {
    if (!selectedJudgeId || !hearingDate || !hearingTime || !selectedCase?._id) {
      alert('Please select a judge, hearing date and hearing time first.');
      return;
    }

    try {
      setValidatingSchedule(true);
      const token = getSessionToken();
      const response = await axios.post(
        '/api/registrar-dashboard/schedule/validate',
        {
          caseId: selectedCase._id,
          judgeId: selectedJudgeId,
          hearingDate,
          hearingTime
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setValidationResult(response.data?.data?.validation || null);
    } catch (error) {
      setValidationResult(error.response?.data?.data?.validation || null);
      alert('Schedule validation failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setValidatingSchedule(false);
    }
  };

  const handleSuggestSlots = async () => {
    if (!selectedJudgeId) {
      alert('Please select a judge first.');
      return;
    }

    try {
      setValidatingSchedule(true);
      const token = getSessionToken();
      const response = await axios.post(
        '/api/registrar-dashboard/schedule/suggest-slots',
        {
          judgeId: selectedJudgeId,
          preferredDate: hearingDate || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSlotSuggestions(response.data?.data?.suggestions || []);
    } catch (error) {
      alert('Unable to suggest schedule slots: ' + (error.response?.data?.message || error.message));
    } finally {
      setValidatingSchedule(false);
    }
  };

  const handleAssignCase = async () => {
    if (!selectedJudgeId || !hearingDate || !hearingTime) {
      alert('Please select a judge and choose hearing date/time.');
      return;
    }

    try {
      const token = getSessionToken();
      await axios.post(
        `/api/registrar-dashboard/assign-case/${selectedCase._id}`,
        {
          judgeId: selectedJudgeId,
          hearingDate,
          hearingTime
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Case assigned successfully!');
      setShowAssignModal(false);
      setSelectedCase(null);
      setSelectedJudgeId('');
      setHearingDate('');
      setHearingTime('09:00');
      setValidationResult(null);
      setSlotSuggestions([]);
      fetchPendingCases();
      fetchAvailableJudges();
      fetchDashboardData();
    } catch (error) {
      alert('Error assigning case: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📊 Registrar Dashboard</h1>
          <p>{dashboardData?.registrar?.name} | {dashboardData?.registrar?.court} | {dashboardData?.registrar?.state}</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'register' ? 'tab active' : 'tab'} onClick={() => setActiveTab('register')}>Register Case</button>
        <button className={activeTab === 'pending' ? 'tab active' : 'tab'} onClick={() => setActiveTab('pending')}>Pending Cases</button>
        <button className={activeTab === 'judges' ? 'tab active' : 'tab'} onClick={() => setActiveTab('judges')}>Judge Availability</button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Cases</h3>
                <p className="stat-number">{dashboardData?.stats?.totalCases || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Assignment</h3>
                <p className="stat-number">{dashboardData?.stats?.pendingCases || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Assigned Today</h3>
                <p className="stat-number">{dashboardData?.stats?.assignedToday || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Available Judges</h3>
                <p className="stat-number">{dashboardData?.stats?.availableJudges || 0}</p>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <button onClick={() => setShowRegisterModal(true)} className="action-btn primary">Register New Case</button>
              <button onClick={() => setActiveTab('pending')} className="action-btn">View Pending Cases</button>
              <button onClick={() => setActiveTab('judges')} className="action-btn">Check Judge Availability</button>
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="register-section">
            <h2>Register New Case</h2>
            <form onSubmit={handleRegisterCase} className="case-form">
              <div className="form-group">
                <label>Case Title</label>
                <input
                  type="text"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Case Type</label>
                <select value={newCase.caseType} onChange={(e) => setNewCase({ ...newCase, caseType: e.target.value })}>
                  <option value="Civil">Civil</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Family">Family</option>
                  <option value="Land">Land</option>
                  <option value="Probate">Probate</option>
                </select>
              </div>

              <h3>Plaintiff Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newCase.plaintiff.name}
                    onChange={(e) => setNewCase({ ...newCase, plaintiff: { ...newCase.plaintiff, name: e.target.value } })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newCase.plaintiff.phoneNumber}
                    onChange={(e) => setNewCase({ ...newCase, plaintiff: { ...newCase.plaintiff, phoneNumber: e.target.value } })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={newCase.plaintiff.address}
                  onChange={(e) => setNewCase({ ...newCase, plaintiff: { ...newCase.plaintiff, address: e.target.value } })}
                />
              </div>

              <h4>Plaintiff's Lawyer</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Lawyer Name</label>
                  <input
                    type="text"
                    value={newCase.plaintiff.lawyer.name}
                    onChange={(e) => setNewCase({ ...newCase, plaintiff: { ...newCase.plaintiff, lawyer: { ...newCase.plaintiff.lawyer, name: e.target.value } } })}
                  />
                </div>
                <div className="form-group">
                  <label>Lawyer Email</label>
                  <input
                    type="email"
                    value={newCase.plaintiff.lawyer.email}
                    onChange={(e) => setNewCase({ ...newCase, plaintiff: { ...newCase.plaintiff, lawyer: { ...newCase.plaintiff.lawyer, email: e.target.value } } })}
                  />
                </div>
              </div>

              <h3>Defendant Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newCase.defendant.name}
                    onChange={(e) => setNewCase({ ...newCase, defendant: { ...newCase.defendant, name: e.target.value } })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newCase.defendant.phoneNumber}
                    onChange={(e) => setNewCase({ ...newCase, defendant: { ...newCase.defendant, phoneNumber: e.target.value } })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={newCase.defendant.address}
                  onChange={(e) => setNewCase({ ...newCase, defendant: { ...newCase.defendant, address: e.target.value } })}
                />
              </div>

              <h4>Defendant's Lawyer</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Lawyer Name</label>
                  <input
                    type="text"
                    value={newCase.defendant.lawyer.name}
                    onChange={(e) => setNewCase({ ...newCase, defendant: { ...newCase.defendant, lawyer: { ...newCase.defendant.lawyer, name: e.target.value } } })}
                  />
                </div>
                <div className="form-group">
                  <label>Lawyer Email</label>
                  <input
                    type="email"
                    value={newCase.defendant.lawyer.email}
                    onChange={(e) => setNewCase({ ...newCase, defendant: { ...newCase.defendant, lawyer: { ...newCase.defendant.lawyer, email: e.target.value } } })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Case Description</label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  rows="4"
                  required
                />
              </div>

              <button type="submit" className="submit-btn">Register Case</button>
            </form>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="pending-section">
            <h2>Pending Cases (Not Assigned)</h2>
            {cases.length === 0 ? (
              <p>No pending cases</p>
            ) : (
              <div className="cases-table">
                <table>
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Filing Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map(c => (
                      <tr key={c._id}>
                        <td>{c.caseNumber}</td>
                        <td>{c.title}</td>
                        <td>{c.caseType}</td>
                        <td>{new Date(c.filingDate).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedCase(c);
                              setSelectedJudgeId('');
                              setValidationResult(null);
                              setSlotSuggestions([]);
                              setHearingTime('09:00');
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              setHearingDate(tomorrow.toISOString().split('T')[0]);
                              setShowAssignModal(true);
                            }}
                            className="assign-btn"
                          >
                            Assign to Judge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'judges' && (
          <div className="judges-section">
            <h2>Judge Availability</h2>
            <div className="judges-grid">
              {availableJudges.map(judge => (
                <div key={judge._id} className={`judge-card ${judge.available ? 'available' : 'unavailable'}`}>
                  <h3>{judge.name}</h3>
                  <p>Cases Today: {judge.capacity}</p>
                  <p className="status">{judge.available ? '✅ Available' : '❌ Full (15/15)'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAssignModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign Case: {selectedCase.caseNumber}</h2>
            <p><strong>Title:</strong> {selectedCase.title}</p>

            <div className="form-row">
              <div className="form-group">
                <label>Hearing Date</label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={(e) => {
                    setHearingDate(e.target.value);
                    setValidationResult(null);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Hearing Time</label>
                <input
                  type="time"
                  value={hearingTime}
                  onChange={(e) => {
                    setHearingTime(e.target.value);
                    setValidationResult(null);
                  }}
                />
              </div>
            </div>

            <h3>Select Judge:</h3>
            <div className="judge-selection">
              {availableJudges.filter(j => j.available).map(judge => (
                <button
                  key={judge._id}
                  onClick={() => {
                    setSelectedJudgeId(judge._id);
                    setValidationResult(null);
                  }}
                  className={`judge-select-btn ${selectedJudgeId === judge._id ? 'selected' : ''}`}
                >
                  {judge.name} ({judge.capacity})
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={handleValidateSchedule} className="submit-btn" disabled={validatingSchedule}>
                {validatingSchedule ? 'Validating...' : 'Validate Schedule'}
              </button>
              <button onClick={handleSuggestSlots} className="cancel-btn" disabled={validatingSchedule}>
                Suggest Slots
              </button>
            </div>

            {validationResult && (
              <div className={`schedule-validation ${validationResult.valid ? 'ok' : 'warn'}`}>
                <p>{validationResult.message}</p>
                {!validationResult.valid && validationResult.conflicts?.length > 0 && (
                  <ul>
                    {validationResult.conflicts.map((item) => (
                      <li key={`${item.caseId}-${item.time}`}>{item.caseNumber} at {item.time}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {slotSuggestions.length > 0 && (
              <div className="suggested-slots">
                <h4>Suggested Slots</h4>
                <div className="slot-grid">
                  {slotSuggestions.map((slot, index) => (
                    <button
                      key={`${slot.date}-${slot.time}-${index}`}
                      className="slot-btn"
                      onClick={() => {
                        const dateValue = new Date(slot.date).toISOString().split('T')[0];
                        setHearingDate(dateValue);
                        setHearingTime(slot.time);
                        setValidationResult(null);
                      }}
                    >
                      {new Date(slot.date).toLocaleDateString()} at {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={handleAssignCase} className="submit-btn">Assign Case</button>
              <button onClick={() => setShowAssignModal(false)} className="close-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarDashboard;
