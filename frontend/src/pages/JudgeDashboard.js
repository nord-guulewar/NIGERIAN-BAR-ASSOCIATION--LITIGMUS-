import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { getSessionToken } from '../utils/sessionAuth';

const JudgeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [cases, setCases] = useState([]);
  const [todaysCases, setTodaysCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showAdjournModal, setShowAdjournModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [availableJudges, setAvailableJudges] = useState([]);

  const [judgmentData, setJudgmentData] = useState({
    verdict: 'In Favor of Plaintiff',
    judgmentText: '',
    orders: ''
  });

  const [adjournData, setAdjournData] = useState({
    reason: '',
    newDate: ''
  });

  // New states for notes, notifications, calendar, fines
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'hearing', description: '', notifyStaff: true });
  const [notifyForm, setNotifyForm] = useState({ message: '', notifyRegistrar: true, notifyRecordsOfficer: true, notifyClerk: true });
  const [fines, setFines] = useState([]);
  const [newFine, setNewFine] = useState({ finedParty: { name: '', role: 'defendant' }, amount: '', reason: '', dueDate: '' });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/judge-dashboard/summary', {
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

  const fetchCases = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/judge-dashboard/cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCases(response.data.data.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  }, []);

  const fetchTodaysCases = useCallback(async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/judge-dashboard/cases/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodaysCases(response.data.data.cases);
    } catch (error) {
      console.error('Error fetching today\'s cases:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchCases();
    fetchTodaysCases();
  }, [fetchCases, fetchDashboardData, fetchTodaysCases]);

  const fetchAvailableJudges = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/judge-dashboard/available-judges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableJudges(response.data.data.judges);
    } catch (error) {
      console.error('Error fetching judges:', error);
    }
  };

  const handleDeliverJudgment = async (e) => {
    e.preventDefault();
    try {
      const token = getSessionToken();
      await axios.post(
        `/api/judge-dashboard/cases/${selectedCase._id}/judgment`,
        judgmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Judgment delivered successfully!');
      setShowJudgmentModal(false);
      setSelectedCase(null);
      fetchDashboardData();
      fetchCases();
      setJudgmentData({ verdict: 'In Favor of Plaintiff', judgmentText: '', orders: '' });
    } catch (error) {
      alert('Error delivering judgment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAdjournCase = async (e) => {
    e.preventDefault();
    try {
      const token = getSessionToken();
      await axios.post(
        `/api/judge-dashboard/cases/${selectedCase._id}/adjourn`,
        adjournData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Case adjourned successfully!');
      setShowAdjournModal(false);
      setSelectedCase(null);
      fetchDashboardData();
      fetchCases();
      setAdjournData({ reason: '', newDate: '' });
    } catch (error) {
      alert('Error adjourning case: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTransferCase = async (newJudgeId) => {
    try {
      const token = getSessionToken();
      await axios.post(
        `/api/judge-dashboard/cases/${selectedCase._id}/transfer`,
        { newJudgeId, reason: 'Transfer requested by judge' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Case transferred successfully!');
      setShowTransferModal(false);
      setSelectedCase(null);
      fetchDashboardData();
      fetchCases();
    } catch (error) {
      alert('Error transferring case: ' + (error.response?.data?.message || error.message));
    }
  };

  // --- Notes Functions ---
  const fetchNotes = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/judge-dashboard-extended/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data.data.notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedCase || !newNoteText.trim()) return;
    try {
      const token = getSessionToken();
      await axios.post(
        `/api/judge-dashboard-extended/cases/${selectedCase._id}/notes`,
        { note: newNoteText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewNoteText('');
      fetchNotes();
      alert('Note saved successfully!');
    } catch (error) {
      alert('Error saving note: ' + (error.response?.data?.message || error.message));
    }
  };

  // --- Notification Functions ---
  const handleNotifyStaff = async () => {
    if (!notifyForm.message.trim()) return;
    try {
      const token = getSessionToken();
      await axios.post(
        '/api/judge-dashboard-extended/notify-staff',
        {
          caseId: selectedCase?._id,
          message: notifyForm.message,
          notifyRegistrar: notifyForm.notifyRegistrar,
          notifyRecordsOfficer: notifyForm.notifyRecordsOfficer,
          notifyClerk: notifyForm.notifyClerk
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifyForm({ ...notifyForm, message: '' });
      alert('Notification sent successfully!');
    } catch (error) {
      alert('Error sending notification: ' + (error.response?.data?.message || error.message));
    }
  };

  // --- Calendar Functions ---
  const fetchCalendarEvents = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/judge-dashboard-extended/calendar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalendarEvents(response.data.data.events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const token = getSessionToken();
      await axios.post(
        '/api/judge-dashboard-extended/calendar',
        newEvent,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewEvent({ title: '', date: '', type: 'hearing', description: '', notifyStaff: true });
      fetchCalendarEvents();
      alert(newEvent.type === 'absence' ? 'Absence notice sent!' : 'Event added to calendar!');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  // --- Fine Functions ---
  const fetchFines = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/judge-dashboard-extended/fines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFines(response.data.data.fines);
    } catch (error) {
      console.error('Error fetching fines:', error);
    }
  };

  const handleImposeFine = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      const token = getSessionToken();
      await axios.post(
        `/api/judge-dashboard-extended/cases/${selectedCase._id}/fines`,
        {
          finedParty: newFine.finedParty,
          amount: parseFloat(newFine.amount),
          reason: newFine.reason,
          dueDate: newFine.dueDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewFine({ finedParty: { name: '', role: 'defendant' }, amount: '', reason: '', dueDate: '' });
      fetchFines();
      alert('Fine imposed successfully!');
    } catch (error) {
      alert('Error imposing fine: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>⚖️ {getGreeting()}, {dashboardData?.judge?.name}</h1>
          <p>Hon. Justice | {dashboardData?.judge?.court} | {dashboardData?.judge?.state}</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'today' ? 'tab active' : 'tab'} onClick={() => setActiveTab('today')}>Today's Cases</button>
        <button className={activeTab === 'all' ? 'tab active' : 'tab'} onClick={() => setActiveTab('all')}>All Cases</button>
        <button className={activeTab === 'notes' ? 'tab active' : 'tab'} onClick={() => { setActiveTab('notes'); fetchNotes(); }}>Case Notes</button>
        <button className={activeTab === 'calendar' ? 'tab active' : 'tab'} onClick={() => { setActiveTab('calendar'); fetchCalendarEvents(); }}>Calendar</button>
        <button className={activeTab === 'notify' ? 'tab active' : 'tab'} onClick={() => setActiveTab('notify')}>Notify Staff</button>
        <button className={activeTab === 'fines' ? 'tab active' : 'tab'} onClick={() => { setActiveTab('fines'); fetchFines(); }}>Fines</button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Assigned Cases</h3>
                <p className="stat-number">{dashboardData?.stats?.totalCases || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Today's Cases</h3>
                <p className="stat-number">{dashboardData?.stats?.todaysCases || 0}/15</p>
              </div>
              <div className="stat-card">
                <h3>Pending Cases</h3>
                <p className="stat-number">{dashboardData?.stats?.pendingCases || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Completed Cases</h3>
                <p className="stat-number">{dashboardData?.stats?.completedCases || 0}</p>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <button onClick={() => setActiveTab('today')} className="action-btn primary">View Today's Cases</button>
              <button onClick={() => setActiveTab('all')} className="action-btn">View All Cases</button>
            </div>
          </div>
        )}

        {activeTab === 'today' && (
          <div className="today-section">
            <h2>Today's Cases ({todaysCases.length}/15)</h2>
            {todaysCases.length === 0 ? (
              <p>No cases scheduled for today</p>
            ) : (
              <div className="cases-grid">
                {todaysCases.map(c => (
                  <div key={c._id} className="case-card">
                    <h3>{c.caseNumber}</h3>
                    <p><strong>Title:</strong> {c.title}</p>
                    <p><strong>Type:</strong> {c.caseType}</p>
                    <p><strong>Status:</strong> <span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></p>
                    <p><strong>Plaintiff:</strong> {c.plaintiff.name}</p>
                    <p><strong>Defendant:</strong> {c.defendant.name}</p>
                    <div className="case-actions">
                      <button onClick={() => { setSelectedCase(c); setShowJudgmentModal(true); }} className="btn-primary">Deliver Judgment</button>
                      <button onClick={() => { setSelectedCase(c); setShowAdjournModal(true); }} className="btn-secondary">Adjourn</button>
                      <button onClick={() => { setSelectedCase(c); fetchAvailableJudges(); setShowTransferModal(true); }} className="btn-tertiary">Transfer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="all-cases-section">
            <h2>All Assigned Cases</h2>
            {cases.length === 0 ? (
              <p>No cases assigned</p>
            ) : (
              <div className="cases-table">
                <table>
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Filing Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map(c => (
                      <tr key={c._id}>
                        <td>{c.caseNumber}</td>
                        <td>{c.title}</td>
                        <td>{c.caseType}</td>
                        <td><span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></td>
                        <td>{new Date(c.filingDate).toLocaleDateString()}</td>
                        <td>
                          <button onClick={() => { setSelectedCase(c); setShowJudgmentModal(true); }} className="action-btn-sm">Judgment</button>
                          <button onClick={() => { setSelectedCase(c); setShowAdjournModal(true); }} className="action-btn-sm">Adjourn</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- CASE NOTES TAB --- */}
        {activeTab === 'notes' && (
          <div className="notes-section">
            <h2>Case Notes</h2>
            <div className="notes-container">
              <div className="note-input">
                <h3>Add New Note</h3>
                <div className="form-group">
                  <label>Select Case:</label>
                  <select onChange={(e) => setSelectedCase(cases.find(c => c._id === e.target.value) || null)} value={selectedCase?._id || ''}>
                    <option value="">-- Select a case --</option>
                    {cases.map(c => (
                      <option key={c._id} value={c._id}>{c.caseNumber} - {c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Your Note:</label>
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    rows="6"
                    placeholder="Enter your notes about this case..."
                    disabled={!selectedCase}
                  />
                </div>
                <button onClick={handleSaveNote} className="submit-btn" disabled={!selectedCase || !newNoteText.trim()}>Save Note</button>
              </div>

              <div className="notes-list">
                <h3>Saved Notes ({notes.length})</h3>
                {notes.length === 0 ? (
                  <p>No notes saved yet</p>
                ) : (
                  notes.map((note, index) => (
                    <div key={index} className="note-card">
                      <h4>{note.title}</h4>
                      <p className="note-date">{new Date(note.createdAt).toLocaleDateString()}</p>
                      <p className="note-text">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- CALENDAR TAB --- */}
        {activeTab === 'calendar' && (
          <div className="calendar-section">
            <h2>Calendar & Absence</h2>
            <div className="calendar-container">
              <div className="event-form">
                <h3>Add Event / Absence Notice</h3>
                <form onSubmit={handleAddEvent}>
                  <div className="form-group">
                    <label>Event Type:</label>
                    <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
                      <option value="hearing">Court Hearing</option>
                      <option value="absence">Absence Notice</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title:</label>
                    <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Date:</label>
                    <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} rows="3" placeholder={newEvent.type === 'absence' ? 'Reason for absence...' : 'Event details...'} />
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input type="checkbox" checked={newEvent.notifyStaff} onChange={(e) => setNewEvent({ ...newEvent, notifyStaff: e.target.checked })} />
                      Notify Registrar, Records Officer & Clerk
                    </label>
                  </div>
                  <button type="submit" className="submit-btn">
                    {newEvent.type === 'absence' ? 'Send Absence Notice' : 'Add to Calendar'}
                  </button>
                </form>
              </div>

              <div className="events-list">
                <h3>Upcoming Events</h3>
                {calendarEvents.length === 0 ? (
                  <p>No events scheduled</p>
                ) : (
                  calendarEvents.map((event, index) => (
                    <div key={index} className={`event-card ${event.type}`}>
                      <h4>{event.title}</h4>
                      <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                      <p><strong>Type:</strong> {event.type}</p>
                      {event.description && <p>{event.description}</p>}
                      {event.notifiedStaff?.length > 0 && (
                        <p className="notified-staff"><i className="bi bi-check-circle"></i> {event.notifiedStaff.length} staff notified</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- NOTIFY STAFF TAB --- */}
        {activeTab === 'notify' && (
          <div className="notify-section">
            <h2>Notify Court Staff</h2>
            <div className="notify-container">
              <div className="notify-form">
                <h3>Send Message to Court Officials</h3>
                <div className="form-group">
                  <label>Related Case (Optional):</label>
                  <select onChange={(e) => setSelectedCase(cases.find(c => c._id === e.target.value) || null)} value={selectedCase?._id || ''}>
                    <option value="">-- General message --</option>
                    {cases.map(c => (
                      <option key={c._id} value={c._id}>{c.caseNumber} - {c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Message:</label>
                  <textarea
                    value={notifyForm.message}
                    onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })}
                    rows="6"
                    placeholder="Enter your message to court officials..."
                    required
                  />
                </div>
                <div className="checkbox-group">
                  <label><input type="checkbox" checked={notifyForm.notifyRegistrar} onChange={(e) => setNotifyForm({ ...notifyForm, notifyRegistrar: e.target.checked })} /> Registrar</label>
                  <label><input type="checkbox" checked={notifyForm.notifyRecordsOfficer} onChange={(e) => setNotifyForm({ ...notifyForm, notifyRecordsOfficer: e.target.checked })} /> Records Officer</label>
                  <label><input type="checkbox" checked={notifyForm.notifyClerk} onChange={(e) => setNotifyForm({ ...notifyForm, notifyClerk: e.target.checked })} /> Clerk</label>
                </div>
                <button onClick={handleNotifyStaff} className="submit-btn" disabled={!notifyForm.message.trim()}>
                  <i className="bi bi-send me-2"></i>Send Notification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- FINES TAB --- */}
        {activeTab === 'fines' && (
          <div className="fines-section">
            <h2>Fines Imposed</h2>
            <div className="fines-container">
              <div className="fine-form">
                <h3>Impose New Fine</h3>
                <div className="form-group">
                  <label>Select Case:</label>
                  <select onChange={(e) => setSelectedCase(cases.find(c => c._id === e.target.value) || null)} value={selectedCase?._id || ''}>
                    <option value="">-- Select a case --</option>
                    {cases.map(c => (
                      <option key={c._id} value={c._id}>{c.caseNumber} - {c.title}</option>
                    ))}
                  </select>
                </div>
                <form onSubmit={handleImposeFine}>
                  <div className="form-group">
                    <label>Fined Party:</label>
                    <input type="text" value={newFine.finedParty.name} onChange={(e) => setNewFine({ ...newFine, finedParty: { ...newFine.finedParty, name: e.target.value } })} placeholder="Name of person/organization" required />
                  </div>
                  <div className="form-group">
                    <label>Party Role:</label>
                    <select value={newFine.finedParty.role} onChange={(e) => setNewFine({ ...newFine, finedParty: { ...newFine.finedParty, role: e.target.value } })}>
                      <option value="defendant">Defendant</option>
                      <option value="plaintiff">Plaintiff</option>
                      <option value="lawyer">Lawyer</option>
                      <option value="witness">Witness</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount (₦):</label>
                    <input type="number" value={newFine.amount} onChange={(e) => setNewFine({ ...newFine, amount: e.target.value })} min="0" required />
                  </div>
                  <div className="form-group">
                    <label>Reason:</label>
                    <textarea value={newFine.reason} onChange={(e) => setNewFine({ ...newFine, reason: e.target.value })} rows="3" required />
                  </div>
                  <div className="form-group">
                    <label>Due Date:</label>
                    <input type="date" value={newFine.dueDate} onChange={(e) => setNewFine({ ...newFine, dueDate: e.target.value })} required />
                  </div>
                  <button type="submit" className="submit-btn" disabled={!selectedCase}>Impose Fine</button>
                </form>
              </div>

              <div className="fines-list">
                <h3>Fines History</h3>
                {fines.length === 0 ? (
                  <p>No fines imposed yet</p>
                ) : (
                  fines.map((fine, index) => (
                    <div key={index} className={`fine-card ${fine.status.toLowerCase()}`}>
                      <h4>{fine.caseNumber}</h4>
                      <p><strong>Fined Party:</strong> {fine.finedParty?.name} ({fine.finedParty?.role})</p>
                      <p><strong>Amount:</strong> ₦{fine.amount?.toLocaleString()}</p>
                      <p><strong>Reason:</strong> {fine.reason}</p>
                      <p><strong>Status:</strong> <span className={`status-badge ${fine.status.toLowerCase()}`}>{fine.status}</span></p>
                      <p><strong>Due Date:</strong> {new Date(fine.dueDate).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Judgment Modal */}
      {showJudgmentModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowJudgmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Deliver Judgment - {selectedCase.caseNumber}</h2>
            <form onSubmit={handleDeliverJudgment}>
              <div className="form-group">
                <label>Verdict</label>
                <select value={judgmentData.verdict} onChange={(e) => setJudgmentData({ ...judgmentData, verdict: e.target.value })}>
                  <option value="In Favor of Plaintiff">In Favor of Plaintiff</option>
                  <option value="In Favor of Defendant">In Favor of Defendant</option>
                  <option value="Dismissed">Dismissed</option>
                  <option value="Settled">Settled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Judgment Text</label>
                <textarea
                  value={judgmentData.judgmentText}
                  onChange={(e) => setJudgmentData({ ...judgmentData, judgmentText: e.target.value })}
                  rows="6"
                  required
                />
              </div>
              <div className="form-group">
                <label>Orders</label>
                <textarea
                  value={judgmentData.orders}
                  onChange={(e) => setJudgmentData({ ...judgmentData, orders: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-btn">Deliver Judgment</button>
                <button type="button" onClick={() => setShowJudgmentModal(false)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjourn Modal */}
      {showAdjournModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowAdjournModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Adjourn Case - {selectedCase.caseNumber}</h2>
            <form onSubmit={handleAdjournCase}>
              <div className="form-group">
                <label>Reason for Adjournment</label>
                <textarea
                  value={adjournData.reason}
                  onChange={(e) => setAdjournData({ ...adjournData, reason: e.target.value })}
                  rows="4"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Date (Optional)</label>
                <input
                  type="date"
                  value={adjournData.newDate}
                  onChange={(e) => setAdjournData({ ...adjournData, newDate: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-btn">Adjourn Case</button>
                <button type="button" onClick={() => setShowAdjournModal(false)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Transfer Case - {selectedCase.caseNumber}</h2>
            <h3>Select Judge:</h3>
            <div className="judge-selection">
              {availableJudges.filter(j => j.available).map(judge => (
                <button
                  key={judge._id}
                  onClick={() => handleTransferCase(judge._id)}
                  className="judge-select-btn"
                >
                  {judge.name} ({judge.capacity})
                </button>
              ))}
            </div>
            <button onClick={() => setShowTransferModal(false)} className="close-btn">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeDashboard;
