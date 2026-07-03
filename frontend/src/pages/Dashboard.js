import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { reportAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await reportAPI.getDashboard();
      setDashboardData(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const caseTypeData = {
    labels: dashboardData?.analytics?.casesByType?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Cases by Type',
        data: dashboardData?.analytics?.casesByType?.map(item => item.count) || [],
        backgroundColor: [
          '#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0',
          '#6610f2', '#fd7e14', '#20c997', '#d63384', '#6c757d'
        ]
      }
    ]
  };

  const stateData = {
    labels: dashboardData?.analytics?.casesByState?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Cases',
        data: dashboardData?.analytics?.casesByState?.map(item => item.count) || [],
        backgroundColor: '#0d6efd'
      }
    ]
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p className="text-muted">Overview of case management system</p>
      </div>

      <Row>
        <Col md={3}>
          <Card className="stat-card primary">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Cases</h6>
                  <h2 className="mb-0">{dashboardData?.cases?.total || 0}</h2>
                </div>
                <i className="bi bi-folder text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <Link to="/cases" className="btn btn-sm btn-outline-primary mt-3 w-100">
                View All
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card success">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Active Cases</h6>
                  <h2 className="mb-0">{dashboardData?.cases?.active || 0}</h2>
                </div>
                <i className="bi bi-folder-check text-success" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <small className="text-muted">
                {dashboardData?.cases?.closed || 0} closed
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card info">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Active Judges</h6>
                  <h2 className="mb-0">{dashboardData?.judges?.total || 0}</h2>
                </div>
                <i className="bi bi-person-badge text-info" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <Link to="/judges" className="btn btn-sm btn-outline-info mt-3 w-100">
                View All
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card warning">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Revenue</h6>
                  <h2 className="mb-0">₦{dashboardData?.revenue?.total?.toLocaleString() || 0}</h2>
                </div>
                <i className="bi bi-currency-dollar text-warning" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <small className="text-muted">
                ₦{dashboardData?.revenue?.pending?.toLocaleString() || 0} pending
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={4}>
          <Card className="stat-card danger">
            <Card.Body>
              <h6 className="text-muted mb-3">Payment Status</h6>
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Paid</span>
                  <strong className="text-success">{dashboardData?.payments?.paid || 0}</strong>
                </div>
              </div>
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Pending</span>
                  <strong className="text-warning">{dashboardData?.payments?.pending || 0}</strong>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between">
                  <span>Overdue</span>
                  <strong className="text-danger">{dashboardData?.payments?.overdue || 0}</strong>
                </div>
              </div>
              <Link to="/payments" className="btn btn-sm btn-outline-danger mt-3 w-100">
                View Payments
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Cases by State (Top 10)</h6>
            </Card.Header>
            <Card.Body>
              {dashboardData?.analytics?.casesByState?.length > 0 ? (
                <Bar
                  data={stateData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false }
                    }
                  }}
                />
              ) : (
                <p className="text-muted text-center">No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Cases by Type</h6>
            </Card.Header>
            <Card.Body>
              {dashboardData?.analytics?.casesByType?.length > 0 ? (
                <Row>
                  <Col md={6}>
                    <Doughnut
                      data={caseTypeData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'right' }
                        }
                      }}
                    />
                  </Col>
                  <Col md={6}>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Case Type</th>
                            <th className="text-end">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.analytics.casesByType.map((item, index) => (
                            <tr key={index}>
                              <td>{item._id}</td>
                              <td className="text-end"><strong>{item.count}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Col>
                </Row>
              ) : (
                <p className="text-muted text-center">No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
