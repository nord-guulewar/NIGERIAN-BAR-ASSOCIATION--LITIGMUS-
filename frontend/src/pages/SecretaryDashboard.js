import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { getSessionToken } from '../utils/sessionAuth';

const SecretaryDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [todaysHearings, setTodaysHearings] = useState([]);
  const [upcomingHearings, setUpcomingHearings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  const [scheduleData, setScheduleData] = useState({
    hearingDate: '',
    hearingTime: '09:00',
    notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchTodaysHearings();
    fetchUpcomingHearings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/secretary-dashboard/summary', {
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
  };

  const fetchTodaysHearings = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/secretary-dashboard/todays-hearings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodaysHearings(response.data.data.causeList);
    } catch (error) {
      console.error('Error fetching hearings:', error);
    }
  };

  const fetchUpcomingHearings = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/secretary-dashboard/upcoming-hearings?days=30', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpcomingHearings(response.data.data.hearings);
    } catch (error) {
      console.error('Error fetching upcoming hearings:', error);
    }
  };

  const handleScheduleHearing = async (e) => {
    e.preventDefault();
    try {
      const token = getSessionToken();
      await axios.post(
        `/api/secretary-dashboard/schedule-hearing/${selectedCase._id}`,
        scheduleData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Hearing scheduled successfully!');
      setShowScheduleModal(false);
      setSelectedCase(null);
      fetchTodaysHearings();
      fetchUpcomingHearings();
      setScheduleData({ hearingDate: '', hearingTime: '09:00', notes: '' });
    } catch (error) {
      alert('Error scheduling hearing: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleNotifyLawyers = async (caseId, notificationType) => {
    try {
      const token = getSessionToken();
      await axios.post(
        `/api/secretary-dashboard/notify-lawyers/${caseId}`,
        { notificationType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Lawyers notified successfully!');
      setShowNotifyModal(false);
    } catch (error) {
      alert('Error notifying lawyers: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendReminders = async (daysAhead) => {
    try {
      const token = getSessionToken();
      const response = await axios.post(
        `/api/secretary-dashboard/send-reminders?daysAhead=${daysAhead}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Sent ${response.data.data.remindersSent.length} reminders successfully!`);
    } catch (error) {
      alert('Error sending reminders: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📅 Secretary Dashboard</h1>
          <p>{dashboardData?.secretary?.name} | {dashboardData?.secretary?.court} | {dashboardData?.secretary?.state}</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'today' ? 'tab active' : 'tab'} onClick={() => setActiveTab('today')}>Today's Cause List</button>
        <button className={activeTab === 'upcoming' ? 'tab active' : 'tab'} onClick={() => setActiveTab('upcoming')}>Upcoming Hearings</button>
        <button className={activeTab === 'reminders' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reminders')}>Send Reminders</button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Today's Hearings</h3>
                <p className="stat-number">{dashboardData?.stats?.todaysHearings || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Upcoming Hearings</h3>
                <p className="stat-number">{dashboardData?.stats?.upcomingHearings || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Needs Scheduling</h3>
                <p className="stat-number">{dashboardData?.stats?.needsScheduling || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Notifications</h3>
                <p className="stat-number">{dashboardData?.stats?.pendingNotifications || 0}</p>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <button onClick={() => setActiveTab('today')} className="action-btn primary">View Today's Cause List</button>
              <button onClick={() => handleSendReminders(7)} className="action-btn">Send 7-Day Reminders</button>
              <button onClick={() => handleSendReminders(1)} className="action-btn">Send 1-Day Reminders</button>
            </div>
          </div>
        )}

        {activeTab === 'today' && (
          <div className="today-section">
            <h2>Today's Cause List - {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            {todaysHearings.length === 0 ? (
              <p>No hearings scheduled for today</p>
            ) : (
              <div className="hearings-table">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Case Number</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Judge</th>
                      <th>Plaintiff</th>
                      <th>Defendant</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysHearings.map((hearing, index) => (
                      <tr key={index}>
                        <td>{hearing.time}</td>
                        <td>{hearing.caseNumber}</td>
                        <td>{hearing.title}</td>
                        <td>{hearing.caseType}</td>
                        <td>{hearing.judge}</td>
                        <td>{hearing.plaintiff} ({hearing.plaintiffLawyer})</td>
                        <td>{hearing.defendant} ({hearing.defendantLawyer})</td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedCase(hearing);
                              setShowNotifyModal(true);
                            }}
                            className="notify-btn"
                          >
                            Notify Lawyers
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

        {activeTab === 'upcoming' && (
          <div className="upcoming-section">
            <h2>Upcoming Hearings (Next 30 Days)</h2>
            {upcomingHearings.length === 0 ? (
              <p>No upcoming hearings</p>
            ) : (
              <div className="hearings-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Case Number</th>
                      <th>Title</th>
                      <th>Judge</th>
                      <th>Plaintiff Lawyer</th>
                      <th>Defendant Lawyer</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingHearings.map((hearing, index) => (
                      <tr key={index}>
                        <td>{new Date(hearing.date).toLocaleDateString()}</td>
                        <td>{hearing.time}</td>
                        <td>{hearing.caseNumber}</td>
                        <td>{hearing.title}</td>
                        <td>{hearing.judge}</td>
                        <td>{hearing.plaintiffLawyer}</td>
                        <td>{hearing.defendantLawyer}</td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedCase(hearing);
                              setShowNotifyModal(true);
                            }}
                            className="notify-btn"
                          >
                            Send Notice
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

        {activeTab === 'reminders' && (
          <div className="reminders-section">
            <h2>Send Hearing Reminders</h2>
            <div className="reminder-actions">
              <div className="reminder-card">
                <h3>30-Day Reminder</h3>
                <p>Send initial hearing notice to lawyers</p>
                <button onClick={() => handleSendReminders(30)} className="reminder-btn">Send 30-Day Reminders</button>
              </div>
              <div className="reminder-card">
                <h3>7-Day Reminder</h3>
                <p>Send first reminder to lawyers</p>
                <button onClick={() => handleSendReminders(7)} className="reminder-btn">Send 7-Day Reminders</button>
              </div>
              <div className="reminder-card">
                <h3>1-Day Reminder</h3>
                <p>Send final reminder to lawyers</p>
                <button onClick={() => handleSendReminders(1)} className="reminder-btn">Send 1-Day Reminders</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showNotifyModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowNotifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Notify Lawyers - {selectedCase.caseNumber}</h2>
            <p><strong>Title:</strong> {selectedCase.title}</p>
            <h3>Select Notification Type:</h3>
            <div className="notification-types">
              <button onClick={() => handleNotifyLawyers(selectedCase._id, 'initial')} className="notify-type-btn">
                Initial Notice
              </button>
              <button onClick={() => handleNotifyLawyers(selectedCase._id, 'reminder')} className="notify-type-btn">
                Reminder
              </button>
              <button onClick={() => handleNotifyLawyers(selectedCase._id, 'adjournment')} className="notify-type-btn">
                Adjournment Notice
              </button>
            </div>
            <button onClick={() => setShowNotifyModal(false)} className="close-btn">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretaryDashboard;
