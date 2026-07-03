import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner, Table, Badge, Modal } from 'react-bootstrap';
import { Gavel, FileText, Search, RefreshCw, PlusCircle, Send, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { getSessionToken, getSessionUser } from '../utils/sessionAuth';

const ClerkDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [dockets, setDockets] = useState([]);
  const [judicialOfficers, setJudicialOfficers] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [generateModal, setGenerateModal] = useState({ show: false, case: null });
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedJudge, setSelectedJudge] = useState('');
  const [docketSummary, setDocketSummary] = useState('');
  const [docketPriority, setDocketPriority] = useState('Medium');
  const [docketHearingDate, setDocketHearingDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [incompleteFilings, setIncompleteFilings] = useState([]);
  const [checklistModal, setChecklistModal] = useState({ show: false, case: null });
  const [filingChecklist, setFilingChecklist] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const userData = getSessionUser();
      setUser(userData);

      try {
        await Promise.all([
          fetchCases(),
          fetchDockets(),
          fetchJudicialOfficers(),
          fetchIncompleteFilings()
        ]);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
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

  const fetchDockets = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/dockets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDockets(response.data.data.dockets || []);
    } catch (error) {
      console.error('Error fetching dockets:', error);
    }
  };

  const fetchJudicialOfficers = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/dockets/judicial-officers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJudicialOfficers(response.data.data.officers || []);
    } catch (error) {
      console.error('Error fetching judicial officers:', error);
    }
  };

  const fetchIncompleteFilings = async () => {
    try {
      const token = getSessionToken();
      const response = await axios.get('/api/dashboard/clerk/incomplete-filings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncompleteFilings(response.data.data.cases || []);
    } catch (error) {
      console.error('Error fetching incomplete filings:', error);
    }
  };

  const openChecklistModal = async (caseData) => {
    try {
      setChecklistLoading(true);
      setChecklistModal({ show: true, case: caseData });
      const token = getSessionToken();
      const response = await axios.get(`/api/dashboard/clerk/filing-checklist/${caseData._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilingChecklist(response.data.data.checklist || []);
    } catch (error) {
      alert('Unable to load filing checklist: ' + (error.response?.data?.message || error.message));
    } finally {
      setChecklistLoading(false);
    }
  };

  const saveChecklist = async () => {
    if (!checklistModal.case?._id) return;

    try {
      setChecklistLoading(true);
      const token = getSessionToken();
      await axios.put(
        `/api/dashboard/clerk/filing-checklist/${checklistModal.case._id}`,
        { checklist: filingChecklist },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Checklist saved successfully.');
      await fetchIncompleteFilings();
      setChecklistModal({ show: false, case: null });
      setFilingChecklist([]);
    } catch (error) {
      alert('Unable to save checklist: ' + (error.response?.data?.message || error.message));
    } finally {
      setChecklistLoading(false);
    }
  };

  const toggleChecklistItem = (index) => {
    setFilingChecklist((current) =>
      current.map((item, idx) => (idx === index ? { ...item, provided: !item.provided } : item))
    );
  };

  const handleGenerateDocket = async (e) => {
    e.preventDefault();
    try {
      const token = getSessionToken();
      const payload = {
        caseId: selectedCase._id,
        sentToId: selectedJudge,
        priority: docketPriority,
        hearingDate: docketHearingDate || undefined
      };

      if (docketSummary.trim()) {
        payload.summary = docketSummary.trim();
      }

      await axios.post(
        '/api/dockets/generate',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Docket generated successfully!');
      setGenerateModal({ show: false, case: null });
      setSelectedCase(null);
      setSelectedJudge('');
      setDocketSummary('');
      setDocketPriority('Medium');
      setDocketHearingDate('');
      fetchDockets();
      fetchCases();
    } catch (error) {
      alert('Error generating docket: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredCases = cases.filter(c =>
    c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading clerk dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>⚖️ Court Clerk Dashboard</h1>
          <p>{user?.firstName} {user?.lastName} | {user?.court}</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button className={activeTab === 'generate' ? 'tab active' : 'tab'} onClick={() => setActiveTab('generate')}>
          Generate Docket
        </button>
        <button className={activeTab === 'filings' ? 'tab active' : 'tab'} onClick={() => setActiveTab('filings')}>
          Filing Checklist ({incompleteFilings.length})
        </button>
        <button className={activeTab === 'dockets' ? 'tab active' : 'tab'} onClick={() => setActiveTab('dockets')}>
          Sent Dockets ({dockets.length})
        </button>
        <button className={activeTab === 'cases' ? 'tab active' : 'tab'} onClick={() => setActiveTab('cases')}>
          All Cases ({cases.length})
        </button>
      </div>

      <Container fluid className="mt-4">
        {activeTab === 'generate' && (
          <Row>
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Generate Docket from Case</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Control
                    type="text"
                    placeholder="Search cases by number or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-3"
                  />
                  <Row>
                    {filteredCases.map(c => (
                      <Col md={6} key={c._id}>
                        <Card
                          className={`case-card ${c.assignedJudge ? 'assigned' : 'unassigned'}`}
                          onClick={() => {
                            setSelectedCase(c);
                            setGenerateModal({ show: true, case: c });
                          }}
                        >
                          <Card.Body>
                            <h6>{c.caseNumber}</h6>
                            <p className="mb-1">{c.title}</p>
                            <small className="text-muted">
                              {c.caseType} | {new Date(c.filingDate).toLocaleDateString()}
                            </small>
                            {c.assignedJudge && (
                              <div className="mt-2">
                                <small className="text-primary">Assigned: {c.assignedJudge.name}</small>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  {filteredCases.length === 0 && (
                    <p className="text-muted">No cases found. {searchTerm ? 'Try a different search.' : 'All cases have been processed.'}</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {activeTab === 'filings' && (
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Incomplete Filing Checklist</h5>
              <Button variant="outline-primary" size="sm" onClick={fetchIncompleteFilings}>Refresh</Button>
            </Card.Header>
            <Card.Body>
              {incompleteFilings.length === 0 ? (
                <p className="text-muted mb-0">No incomplete filings found.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Completion</th>
                      <th>Missing Documents</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incompleteFilings.map((item) => (
                      <tr key={item._id}>
                        <td>{item.caseNumber}</td>
                        <td>{item.title}</td>
                        <td>{item.caseType}</td>
                        <td>
                          <Badge bg={item.completionPercent >= 80 ? 'warning' : 'danger'}>
                            {item.completionPercent}%
                          </Badge>
                        </td>
                        <td>{(item.missingDocuments || []).join(', ') || 'N/A'}</td>
                        <td>
                          <Button size="sm" onClick={() => openChecklistModal(item)}>Open Checklist</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'dockets' && (
          <Card>
            <Card.Header>
              <h5 className="mb-0">Sent Dockets</h5>
            </Card.Header>
            <Card.Body>
              {dockets.length === 0 ? (
                <p className="text-muted">No dockets sent yet.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Docket #</th>
                      <th>Case</th>
                      <th>Sent To</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dockets.map(d => (
                      <tr key={d._id}>
                        <td>{d.docketNumber}</td>
                        <td>{d.case?.caseNumber}</td>
                        <td>{d.sentTo?.firstName} {d.sentTo?.lastName} ({d.sentToRole})</td>
                        <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Badge bg={d.status === 'Acknowledged' ? 'success' : d.status === 'Pending' ? 'warning' : 'info'}>
                            {d.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'cases' && (
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

      <Modal show={generateModal.show} onHide={() => setGenerateModal({ show: false, case: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Generate Docket for {generateModal.case?.caseNumber}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerateDocket}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select Judge</Form.Label>
              <Form.Select value={selectedJudge} onChange={(e) => setSelectedJudge(e.target.value)} required>
                <option value="">-- Select Judicial Officer --</option>
                {judicialOfficers.map(j => (
                  <option key={j._id} value={j._id}>
                    {j.title} {j.firstName} {j.lastName} ({j.court})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Summary</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={docketSummary}
                onChange={(e) => setDocketSummary(e.target.value)}
                placeholder="Case summary for the judge..."
                defaultValue={`${generateModal.case?.caseNumber}: ${generateModal.case?.title}`}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select value={docketPriority} onChange={(e) => setDocketPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hearing Date (Optional)</Form.Label>
              <Form.Control
                type="date"
                value={docketHearingDate}
                onChange={(e) => setDocketHearingDate(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setGenerateModal({ show: false, case: null })}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <Send className="me-2" size={16} />Generate Docket
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={checklistModal.show} onHide={() => setChecklistModal({ show: false, case: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Filing Checklist: {checklistModal.case?.caseNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {checklistLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : (
            <div>
              {filingChecklist.length === 0 ? (
                <Alert variant="info" className="mb-0">No checklist items available.</Alert>
              ) : (
                filingChecklist.map((item, index) => (
                  <Form.Check
                    key={`${item.name}-${index}`}
                    type="checkbox"
                    id={`checklist-${index}`}
                    className="mb-2"
                    label={`${item.name}${item.required ? ' (Required)' : ''}`}
                    checked={Boolean(item.provided)}
                    onChange={() => toggleChecklistItem(index)}
                  />
                ))
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setChecklistModal({ show: false, case: null })}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveChecklist} disabled={checklistLoading || filingChecklist.length === 0}>
            Save Checklist
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClerkDashboard;