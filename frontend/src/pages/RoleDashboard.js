import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Row, Col, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import './Dashboard.css';
import { getSessionToken, getSessionUser } from '../utils/sessionAuth';

const API_BASE = '/api';

const ROLE_CONFIG = {
  bailiff: {
    title: 'Bailiff Dashboard',
    summaryPath: '/dashboard/bailiff/summary',
    profileKey: 'bailiff',
    tabs: ['overview', 'summons'],
    summaryStats: ['pendingSummons', 'servedToday', 'totalServed', 'failedService'],
    listPath: '/dashboard/bailiff/summons',
    listKey: 'summons',
    listColumns: ['caseNumber', 'summonsType', 'status', 'serviceDate']
  },
  record_officer: {
    title: 'Records Dashboard',
    summaryPath: '/dashboard/records/summary',
    profileKey: 'officer',
    tabs: ['overview', 'archiving', 'search'],
    summaryStats: ['needsArchiving', 'archivedCases', 'casesWithDocuments', 'totalCases'],
    listPath: '/dashboard/records/needs-archiving',
    listKey: 'cases',
    listColumns: ['caseNumber', 'title', 'status', 'updatedAt']
  },
  administrator: {
    title: 'Administrator Dashboard',
    summaryPath: '/dashboard/admin/summary',
    profileKey: 'administrator',
    tabs: ['overview', 'staff', 'analytics'],
    summaryStats: ['totalCases', 'activeCases', 'totalStaff', 'totalJudges']
  },
  librarian: {
    title: 'Law Librarian Dashboard',
    summaryPath: '/dashboard/librarian/summary',
    profileKey: 'librarian',
    tabs: ['overview'],
    summaryStats: ['pendingRequests', 'completedToday', 'totalCompleted']
  },
  litigation: {
    title: 'Litigation Officer Dashboard',
    summaryPath: '/dashboard/litigation/summary',
    profileKey: 'officer',
    tabs: ['overview'],
    summaryStats: ['governmentCases', 'activeCases']
  },
  prosecutor: {
    title: 'Public Prosecutor Dashboard',
    summaryPath: '/dashboard/prosecutor/summary',
    profileKey: 'prosecutor',
    tabs: ['overview'],
    summaryStats: ['criminalCases', 'activeProsecutions', 'convictions']
  },
  probate: {
    title: 'Probate Officer Dashboard',
    summaryPath: '/dashboard/probate/summary',
    profileKey: 'officer',
    tabs: ['overview'],
    summaryStats: ['probateCases', 'pendingApplications']
  },
  court_reporter: {
    title: 'Court Reporter Dashboard',
    summaryPath: '/dashboard/reporter/summary',
    profileKey: 'reporter',
    tabs: ['overview'],
    summaryStats: ['todaysHearings']
  },
  usher: {
    title: 'Court Usher Dashboard',
    summaryPath: '/dashboard/usher/summary',
    profileKey: 'usher',
    tabs: ['overview'],
    summaryStats: ['todaysHearings']
  },
  security: {
    title: 'Security Officer Dashboard',
    summaryPath: '/dashboard/security/summary',
    profileKey: 'officer',
    tabs: ['overview'],
    summaryStats: ['todaysLogs', 'openIncidents']
  }
};

const request = async (path) => {
  const token = getSessionToken();
  const response = await axios.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data || {};
};

const RoleDashboard = ({ role }) => {
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.administrator;
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [listData, setListData] = useState([]);
  const [staff, setStaff] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceSla, setServiceSla] = useState(null);

  useEffect(() => {
    const userData = getSessionUser();
    setUser(userData);
    loadDashboard();
  }, [role]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const summary = await request(config.summaryPath);
      setDashboardData(summary);
      if (role === 'bailiff') await loadServiceSla();
      if (role === 'administrator' && activeTab === 'staff') await loadStaff();
      if (role === 'administrator' && activeTab === 'analytics') await loadAnalytics();
      if (config.listPath && activeTab !== 'overview') await loadList();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadList = async () => {
    try {
      const data = await request(config.listPath);
      setListData(data[config.listKey] || []);
    } catch (err) {
      setListData([]);
    }
  };

  const loadStaff = async () => {
    const data = await request('/dashboard/admin/staff');
    setStaff(data.staff || []);
  };

  const loadAnalytics = async () => {
    const data = await request('/dashboard/admin/analytics');
    setAnalytics(data);
  };

  const loadServiceSla = async () => {
    try {
      const data = await request('/dashboard/bailiff/service-sla');
      setServiceSla(data);
    } catch (err) {
      // Keep the dashboard usable even if SLA endpoint is not yet available on backend.
      setServiceSla(null);
    }
  };

  const handleArchive = async (caseId) => {
    const location = window.prompt('Archive location');
    if (!location) return;
    const token = getSessionToken();
    await axios.post(`${API_BASE}/dashboard/records/archive/${caseId}`, { archiveLocation: location }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Case archived successfully');
    loadDashboard();
  };

  const handleRetrieve = async (caseId) => {
    const purpose = window.prompt('Retrieval purpose');
    if (!purpose) return;
    const token = getSessionToken();
    await axios.post(`${API_BASE}/dashboard/records/retrieve/${caseId}`, { purpose }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Case retrieved successfully');
    loadDashboard();
  };

  const handleService = async (summonsId, status) => {
    if (status === 'Failed') {
      const reason = window.prompt('Failed service reason (required)');
      if (!reason) return;
      const reasonCode = window.prompt('Reason code (e.g. PARTY_NOT_FOUND, ADDRESS_INVALID, REFUSED_SERVICE, OTHER)', 'OTHER') || 'OTHER';
      const nextAction = window.prompt('Next action (optional)', 'Reschedule service attempt') || '';
      const token = getSessionToken();
      await axios.post(`${API_BASE}/dashboard/bailiff/mark-failed/${summonsId}`, {
        reason,
        reasonCode,
        nextAction
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Summons marked as failed with reason details.');
      loadDashboard();
      return;
    }

    const serviceMethod = window.prompt('Service method', 'Personal Service');
    if (!serviceMethod) return;
    const serviceLocation = window.prompt('Service location', 'Court premises');
    if (!serviceLocation) return;
    const recipientName = window.prompt('Recipient name (optional)', '');
    const recipientRelationship = window.prompt('Recipient relationship (optional)', '');
    const evidenceReference = window.prompt('Evidence reference (optional: photo file or receipt id)', '');
    const serviceNotes = window.prompt('Service notes', 'Served successfully');

    const token = getSessionToken();
    await axios.post(`${API_BASE}/dashboard/bailiff/record-service/${summonsId}`, {
      serviceNotes,
      serviceMethod,
      serviceLocation,
      recipientName,
      recipientRelationship,
      evidenceReference,
      serviceTime: new Date().toISOString()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Summons service updated');
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading {config.title.toLowerCase()}...</p>
      </div>
    );
  }

  const profile = dashboardData?.[config.profileKey];
  const stats = dashboardData?.stats || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>{config.title}</h1>
          <p>{profile?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Officer'} | {profile?.court || user?.court || ''} | {profile?.state || user?.state || ''}</p>
        </div>
      </header>

      {error && <Alert variant="danger" className="m-3">{error}</Alert>}

      <div className="dashboard-tabs">
        {config.tabs.map(tab => (
          <button key={tab} className={activeTab === tab ? 'tab active' : 'tab'} onClick={() => {
            setActiveTab(tab);
            if (role === 'administrator' && tab === 'staff') loadStaff();
            if (role === 'administrator' && tab === 'analytics') loadAnalytics();
            if (config.listPath && tab !== 'overview') loadList();
          }}>{tab.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</button>
        ))}
      </div>

      <Container fluid className="mt-4">
        {activeTab === 'overview' && (
          <Row className="g-3">
            {config.summaryStats.map(stat => (
              <Col md={3} key={stat}>
                <Card className="stat-card">
                  <Card.Body>
                    <h3>{stat.replace(/([A-Z])/g, ' $1')}</h3>
                    <p className="stat-number">{stats[stat] || 0}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {role === 'bailiff' && serviceSla && (
              <>
                <Col md={4}>
                  <Card className="stat-card">
                    <Card.Body>
                      <h3>Pending SLA</h3>
                      <p className="stat-number">{serviceSla.pending || 0}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="stat-card">
                    <Card.Body>
                      <h3>Due Soon (48h)</h3>
                      <p className="stat-number">{serviceSla.dueSoon || 0}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="stat-card">
                    <Card.Body>
                      <h3>Overdue (72h)</h3>
                      <p className="stat-number">{serviceSla.overdue || 0}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </>
            )}
            {config.listPath && (
              <Col md={12}>
                <Card>
                  <Card.Header>Recent Items</Card.Header>
                  <Card.Body>
                    <Button variant="outline-primary" onClick={loadList}>Refresh List</Button>
                    {listData.length === 0 ? (
                      <p className="text-muted mt-3">No items available.</p>
                    ) : (
                      <Table responsive hover className="mt-3">
                        <thead>
                          <tr>
                            {config.listColumns.map(column => <th key={column}>{column}</th>)}
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listData.map(item => (
                            <tr key={item.id || item._id || item.caseNumber}>
                              {config.listColumns.map(column => (
                                <td key={column}>
                                  {column === 'status' ? <Badge bg={item[column] === 'Pending' ? 'warning' : 'info'}>{item[column]}</Badge> : item[column] || 'N/A'}
                                </td>
                              ))}
                              <td>
                                {role === 'bailiff' && item.status !== 'Served' && <Button size="sm" onClick={() => handleService(item.id || item._id, 'Served')}>Mark Served</Button>}
                                {role === 'bailiff' && item.status !== 'Served' && <Button size="sm" variant="warning" className="ms-2" onClick={() => handleService(item.id || item._id, 'Failed')}>Mark Failed</Button>}
                                {role === 'record_officer' && <Button size="sm" className="me-2" onClick={() => handleArchive(item.id || item._id)}>Archive</Button>}
                                {role === 'record_officer' && <Button size="sm" variant="secondary" onClick={() => handleRetrieve(item.id || item._id)}>Retrieve</Button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        )}

        {role === 'administrator' && activeTab === 'staff' && (
          <Card>
            <Card.Header>Staff Directory</Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Email</th><th>Court</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {staff.map(member => (
                    <tr key={member.id || member._id}>
                      <td>{member.firstName} {member.lastName}</td>
                      <td>{member.role}</td>
                      <td>{member.email}</td>
                      <td>{member.court}</td>
                      <td><Badge bg={member.isActive ? 'success' : 'secondary'}>{member.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

        {role === 'administrator' && activeTab === 'analytics' && (
          <Row className="g-3">
            <Col md={6}><Card><Card.Header>Cases by Type</Card.Header><Card.Body><pre>{JSON.stringify(analytics?.casesByType || [], null, 2)}</pre></Card.Body></Card></Col>
            <Col md={6}><Card><Card.Header>Cases by Status</Card.Header><Card.Body><pre>{JSON.stringify(analytics?.casesByStatus || [], null, 2)}</pre></Card.Body></Card></Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export const BailiffDashboard = () => <RoleDashboard role="bailiff" />;
export const RecordsDashboard = () => <RoleDashboard role="record_officer" />;
export const AdministratorDashboard = () => <RoleDashboard role="administrator" />;
export const LibrarianDashboard = () => <RoleDashboard role="librarian" />;
export const LitigationDashboard = () => <RoleDashboard role="litigation" />;
export const ProbateDashboard = () => <RoleDashboard role="probate" />;
export const CourtReporterDashboard = () => <RoleDashboard role="court_reporter" />;
export const UsherDashboard = () => <RoleDashboard role="usher" />;
export const SecurityDashboard = () => <RoleDashboard role="security" />;

export default RoleDashboard;
