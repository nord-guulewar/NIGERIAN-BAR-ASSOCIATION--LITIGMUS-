import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner, Table, Badge } from 'react-bootstrap';
import { Gavel, FileText, Search, Filter, Download, PlusCircle } from 'lucide-react';
import axios from 'axios';
import { getSessionToken, getSessionUser } from '../utils/sessionAuth';

const ProsecutorDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [probonoCases, setProbonoCases] = useState([]);
  const [activeTab, setActiveTab] = useState('probono');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [documentationModal, setDocumentationModal] = useState({ show: false, case: null });
  const [documentationData, setDocumentationData] = useState({ notes: '', outcome: '', nextSteps: '' });

  useEffect(() => {
    const userData = getSessionUser();
    setUser(userData);
    fetchProBonoCases();
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCases(response.data.data.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchProBonoCases = async () => {
    setLoading(true);
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/cases?probono=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProbonoCases(response.data.data.cases || []);
    } catch (error) {
      console.error('Error fetching pro bono cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentCase = async (e) => {
    e.preventDefault();
    try {
      const token = getSessionToken();
      await axios.put(
        `/api/cases/${documentationData.caseId}/probono-documentation`,
        {
          probonoDocumentation: documentationData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Case documented successfully!');
      setDocumentationModal({ show: false, case: null });
      setDocumentationData({ notes: '', outcome: '', nextSteps: '' });
      fetchProBonoCases();
    } catch (error) {
      alert('Error documenting case: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredProbonoCases = probonoCases.filter(c => {
    const matchesSearch = c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading prosecutor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>⚖️ Public Prosecutor Dashboard</h1>
          <p>{user?.firstName} {user?.lastName} | {user?.court}</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button className={activeTab === 'probono' ? 'tab active' : 'tab'} onClick={() => setActiveTab('probono')}>
          Pro Bono Cases ({probonoCases.length})
        </button>
        <button className={activeTab === 'all' ? 'tab active' : 'tab'} onClick={() => setActiveTab('all')}>
          All Cases ({cases.length})
        </button>
      </div>

      <Container fluid className="mt-4">
        {activeTab === 'probono' && (
          <>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="Search by case number or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Review">In Review</option>
                  <option value="Actioned">Actioned</option>
                  <option value="Returned">Returned</option>
                </Form.Select>
              </Col>
            </Row>

            <Card>
              <Card.Header>
                <h5 className="mb-0">Pro Bono Cases (View & Document Only)</h5>
              </Card.Header>
              <Card.Body>
                {filteredProbonoCases.length === 0 ? (
                  <p className="text-muted">No pro bono cases found.</p>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Case Number</th>
                        <th>Title</th>
                        <th>Filing Date</th>
                        <th>Status</th>
                        <th>Pro Bono Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProbonoCases.map(c => (
                        <tr key={c._id}>
                          <td>{c.caseNumber}</td>
                          <td>{c.title}</td>
                          <td>{new Date(c.filingDate).toLocaleDateString()}</td>
                          <td><Badge bg={c.status === 'Pending' ? 'warning' : c.status === 'Actioned' ? 'success' : 'info'}>{c.status}</Badge></td>
                          <td>{c.isProBono ? 'Yes' : 'No'}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => setDocumentationModal({ show: true, case: c })}
                            >
                              Document
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </>
        )}

        {activeTab === 'all' && (
          <Card>
            <Card.Header>
              <h5 className="mb-0">All Cases</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Case Number</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Assigned Judge</th>
                    <th>Filing Date</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c._id}>
                      <td>{c.caseNumber}</td>
                      <td>{c.title}</td>
                      <td>{c.caseType}</td>
                      <td><Badge bg={c.status === 'Pending' ? 'warning' : c.status === 'Closed' ? 'secondary' : 'info'}>{c.status}</Badge></td>
                      <td>{c.assignedJudge?.name || 'Unassigned'}</td>
                      <td>{new Date(c.filingDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </Container>

      {documentationModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Document Pro Bono Case: {documentationModal.case?.caseNumber}</h3>
            <Form onSubmit={handleDocumentCase}>
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={documentationData.notes}
                  onChange={(e) => setDocumentationData({ ...documentationData, notes: e.target.value })}
                  placeholder="Document your observations..."
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Outcome</Form.Label>
                <Form.Select
                  value={documentationData.outcome}
                  onChange={(e) => setDocumentationData({ ...documentationData, outcome: e.target.value })}
                  required
                >
                  <option value="">Select outcome</option>
                  <option value="Pending Further Action">Pending Further Action</option>
                  <option value="Recommended for Prosecution">Recommended for Prosecution</option>
                  <option value="Insufficient Evidence">Insufficient Evidence</option>
                  <option value="Case Dismissed">Case Dismissed</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Next Steps</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={documentationData.nextSteps}
                  onChange={(e) => setDocumentationData({ ...documentationData, nextSteps: e.target.value })}
                  placeholder="Recommended next steps..."
                />
              </Form.Group>
              <div className="d-flex gap-2">
                <Button variant="primary" type="submit">Save Documentation</Button>
                <Button variant="outline-secondary" onClick={() => setDocumentationModal({ show: false, case: null })}>
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProsecutorDashboard;