import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Spinner, Alert, Table } from 'react-bootstrap';
import { judgeAPI } from '../services/api';
import moment from 'moment';

const JudgeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [judgeData, setJudgeData] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJudgeDetails();
    fetchWorkload();
  }, [id]);

  const fetchJudgeDetails = async () => {
    try {
      const response = await judgeAPI.getById(id);
      setJudgeData(response.data.data.judge);
      setLoading(false);
    } catch (err) {
      setError('Failed to load judge details');
      setLoading(false);
    }
  };

  const fetchWorkload = async () => {
    try {
      const response = await judgeAPI.getWorkload(id);
      setWorkload(response.data.data);
    } catch (err) {
      console.error('Failed to load workload');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading judge details...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>{judgeData.title} {judgeData.firstName} {judgeData.lastName}</h2>
          <p className="text-muted">{judgeData.courtType} - {judgeData.state}</p>
        </div>
        <Button variant="outline-secondary" onClick={() => navigate('/judges')}>
          <i className="bi bi-arrow-left me-2"></i>Back
        </Button>
      </div>

      <Row>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Header><h6 className="mb-0">Judge Information</h6></Card.Header>
            <Card.Body>
              <p><strong>Title:</strong> {judgeData.title}</p>
              <p><strong>Email:</strong> {judgeData.email}</p>
              <p><strong>Phone:</strong> {judgeData.phoneNumber}</p>
              <p><strong>Court Type:</strong> {judgeData.courtType}</p>
              <p><strong>State:</strong> {judgeData.state}</p>
              <p><strong>Status:</strong> {judgeData.isActive ? (
                <Badge bg="success">Active</Badge>
              ) : (
                <Badge bg="secondary">Inactive</Badge>
              )}</p>
              <p><strong>Appointment Date:</strong> {moment(judgeData.appointmentDate).format('MMM DD, YYYY')}</p>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header><h6 className="mb-0">Specialization</h6></Card.Header>
            <Card.Body>
              {judgeData.specialization && judgeData.specialization.length > 0 ? (
                judgeData.specialization.map((spec, index) => (
                  <Badge key={index} bg="primary" className="me-2 mb-2">{spec}</Badge>
                ))
              ) : (
                <p className="text-muted">No specialization listed</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="mb-3">
            <Card.Header><h6 className="mb-0">Workload Statistics</h6></Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-primary">{workload?.todayCases || 0}</h3>
                    <p className="text-muted">Today's Cases</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-warning">{workload?.totalActiveCases || 0}</h3>
                    <p className="text-muted">Active Cases</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-success">{judgeData.totalCasesHandled || 0}</h3>
                    <p className="text-muted">Total Handled</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h3 className="text-info">{judgeData.maxDailyCases}</h3>
                    <p className="text-muted">Max Daily</p>
                  </div>
                </Col>
              </Row>
              <div className="mt-3">
                <p><strong>Can Take More Cases:</strong> {workload?.canTakeMoreCases ? (
                  <Badge bg="success">Yes</Badge>
                ) : (
                  <Badge bg="danger">No</Badge>
                )}</p>
              </div>
            </Card.Body>
          </Card>

          {workload?.cases && workload.cases.length > 0 && (
            <Card className="mb-3">
              <Card.Header><h6 className="mb-0">Today's Cases</h6></Card.Header>
              <Card.Body>
                <Table hover size="sm">
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workload.cases.map(caseItem => (
                      <tr key={caseItem._id}>
                        <td><strong>{caseItem.caseNumber}</strong></td>
                        <td>{caseItem.title}</td>
                        <td>{caseItem.caseType}</td>
                        <td><Badge bg="info">{caseItem.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default JudgeDetails;
