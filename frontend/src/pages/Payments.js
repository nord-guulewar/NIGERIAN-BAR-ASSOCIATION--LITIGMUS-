import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { paymentAPI } from '../services/api';
import moment from 'moment';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchDuePayments();
    fetchOverduePayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await paymentAPI.getAll();
      setPayments(response.data.data.payments);
      setLoading(false);
    } catch (err) {
      setError('Failed to load payments');
      setLoading(false);
    }
  };

  const fetchDuePayments = async () => {
    try {
      const response = await paymentAPI.getDue();
      setDuePayments(response.data.data.payments);
    } catch (err) {
      console.error('Failed to load due payments');
    }
  };

  const fetchOverduePayments = async () => {
    try {
      const response = await paymentAPI.getOverdue();
      setOverduePayments(response.data.data.payments);
    } catch (err) {
      console.error('Failed to load overdue payments');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'Paid': 'success',
      'Overdue': 'danger',
      'Cancelled': 'secondary',
      'Refunded': 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Payments</h2>
        <p className="text-muted">Manage court payments and fees</p>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="stat-card warning">
            <Card.Body>
              <h6 className="text-muted">Due Today</h6>
              <h3 className="text-warning">{duePayments.length}</h3>
              <p className="text-muted mb-0">Payments due today</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card danger">
            <Card.Body>
              <h6 className="text-muted">Overdue</h6>
              <h3 className="text-danger">{overduePayments.length}</h3>
              <p className="text-muted mb-0">Overdue payments</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card success">
            <Card.Body>
              <h6 className="text-muted">Total Payments</h6>
              <h3 className="text-success">{payments.length}</h3>
              <p className="text-muted mb-0">All time</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h6 className="mb-0">All Payments</h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Payment Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map(payment => (
                    <tr key={payment._id}>
                      <td><strong>{payment.receiptNumber || 'N/A'}</strong></td>
                      <td>{payment.paymentType}</td>
                      <td>₦{payment.amount.toLocaleString()}</td>
                      <td>{moment(payment.dueDate).format('MMM DD, YYYY')}</td>
                      <td>{payment.paymentDate ? moment(payment.paymentDate).format('MMM DD, YYYY') : '-'}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>{payment.state}</td>
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

export default Payments;
