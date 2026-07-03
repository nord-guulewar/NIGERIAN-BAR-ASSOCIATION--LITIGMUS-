import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Badge, Form, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { caseAPI, stateAPI, courtAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { generateCaseListReport } from '../utils/pdfGenerator';
import moment from 'moment';

const Cases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    courtType: '',
    state: '',
    caseType: ''
  });
  const [states, setStates] = useState([]);
  const [courts, setCourts] = useState([]);
  const [caseTypes, setCaseTypes] = useState([]);
  
  const canRegisterCase = ['admin', 'registrar', 'clerk'].includes(user?.role);

  const fetchStates = useCallback(async () => {
    try {
      const response = await stateAPI.getAll();
      setStates(response.data.data.states);
    } catch (err) {
      console.error('Failed to fetch states');
    }
  }, []);

  const fetchCourts = useCallback(async () => {
    try {
      const response = await courtAPI.getAll();
      setCourts(response.data.data.courts);
    } catch (err) {
      console.error('Failed to fetch courts');
    }
  }, []);

  const fetchCaseTypes = useCallback(async () => {
    try {
      const response = await courtAPI.getCaseTypes();
      setCaseTypes(response.data.data.caseTypes);
    } catch (err) {
      console.error('Failed to fetch case types');
    }
  }, []);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.courtType) params.courtType = filters.courtType;
      if (filters.state) params.state = filters.state;
      if (filters.caseType) params.caseType = filters.caseType;

      const response = await caseAPI.getAll(params);
      setCases(response.data.data.cases);
      setLoading(false);
    } catch (err) {
      setError('Failed to load cases');
      setLoading(false);
    }
  }, [filters.caseType, filters.courtType, filters.state, filters.status]);

  useEffect(() => {
    fetchStates();
    fetchCourts();
    fetchCaseTypes();
  }, [fetchCaseTypes, fetchCourts, fetchStates]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'In Progress': 'primary',
      'Adjourned': 'info',
      'Judgement Reserved': 'secondary',
      'Closed': 'success',
      'Dismissed': 'danger',
      'Settled': 'success'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      courtType: '',
      state: '',
      caseType: ''
    });
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Cases</h2>
          <p className="text-muted">Manage all court cases</p>
        </div>
        <div>
          <Button 
            variant="success" 
            onClick={() => generateCaseListReport(cases)}
            className="me-2"
            disabled={cases.length === 0}
          >
            <i className="bi bi-file-earmark-pdf me-2"></i>
            Export PDF
          </Button>
          {canRegisterCase && (
            <Link to="/cases/new" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Register New Case
            </Link>
          )}
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Adjourned">Adjourned</option>
                  <option value="Judgement Reserved">Judgement Reserved</option>
                  <option value="Closed">Closed</option>
                  <option value="Dismissed">Dismissed</option>
                  <option value="Settled">Settled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Court Type</Form.Label>
                <Form.Select
                  value={filters.courtType}
                  onChange={(e) => handleFilterChange('courtType', e.target.value)}
                >
                  <option value="">All Courts</option>
                  {courts.map(court => (
                    <option key={court.code} value={court.code}>{court.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>State</Form.Label>
                <Form.Select
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                >
                  <option value="">All States</option>
                  {states.map(state => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Case Type</Form.Label>
                <Form.Select
                  value={filters.caseType}
                  onChange={(e) => handleFilterChange('caseType', e.target.value)}
                >
                  <option value="">All Types</option>
                  {caseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="mt-3">
            <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
              <i className="bi bi-x-circle me-2"></i>
              Reset Filters
            </Button>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading cases...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Case Number</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Court</th>
                    <th>State</th>
                    <th>Filing Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        No cases found
                      </td>
                    </tr>
                  ) : (
                    cases.map(caseItem => (
                      <tr key={caseItem._id}>
                        <td><strong>{caseItem.caseNumber}</strong></td>
                        <td>{caseItem.title}</td>
                        <td>{caseItem.caseType}</td>
                        <td>{caseItem.courtType}</td>
                        <td>{caseItem.state}</td>
                        <td>{moment(caseItem.filingDate).format('MMM DD, YYYY')}</td>
                        <td>{getStatusBadge(caseItem.status)}</td>
                        <td>
                          <Link
                            to={`/cases/${caseItem._id}`}
                            className="btn btn-sm btn-outline-primary btn-action"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            {cases.length > 0 && (
              <div className="mt-3 text-muted">
                Showing {cases.length} case(s)
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Cases;
