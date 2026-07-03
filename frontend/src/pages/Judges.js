import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Badge, Card, Spinner, Alert } from 'react-bootstrap';
import { judgeAPI } from '../services/api';

const Judges = () => {
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJudges();
  }, []);

  const fetchJudges = async () => {
    try {
      const response = await judgeAPI.getAll();
      setJudges(response.data.data.judges);
      setLoading(false);
    } catch (err) {
      setError('Failed to load judges');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading judges...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Judges</h2>
        <p className="text-muted">Manage judges and their workload</p>
      </div>

      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Court Type</th>
                  <th>State</th>
                  <th>Specialization</th>
                  <th>Current Load</th>
                  <th>Max Daily Cases</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {judges.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No judges found
                    </td>
                  </tr>
                ) : (
                  judges.map(judge => (
                    <tr key={judge._id}>
                      <td><strong>{judge.title} {judge.firstName} {judge.lastName}</strong></td>
                      <td>{judge.courtType}</td>
                      <td>{judge.state}</td>
                      <td>{judge.specialization?.join(', ') || 'N/A'}</td>
                      <td>{judge.currentCaseLoad}</td>
                      <td>{judge.maxDailyCases}</td>
                      <td>
                        {judge.isActive ? (
                          <Badge bg="success">Active</Badge>
                        ) : (
                          <Badge bg="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/judges/${judge._id}`}
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
        </Card.Body>
      </Card>
    </div>
  );
};

export default Judges;
