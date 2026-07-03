import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, submitAdminUnlockRequest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [lockedMeta, setLockedMeta] = useState(null);
  const [unlockForm, setUnlockForm] = useState({
    documentType: 'official-id',
    documentReference: '',
    explanation: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLockedMeta(null);
    setLoading(true);

    const result = await adminLogin(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/admin-dashboard');
      return;
    }

    setError(result.message);
    if (result.data?.documentsRequired) {
      setLockedMeta(result.data);
    }
  };

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const result = await submitAdminUnlockRequest({
      email,
      documentType: unlockForm.documentType,
      documentReference: unlockForm.documentReference,
      explanation: unlockForm.explanation
    });

    setLoading(false);

    if (result.success) {
      setMessage('Unlock documents submitted successfully. Awaiting approval by another administrator.');
      return;
    }

    setError(result.message);
  };

  return (
    <div className="login-container py-4">
      <Container style={{ maxWidth: 560 }}>
      <Card className="login-card shadow-sm border-0">
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <h2 className="login-brand-title mb-1">Admin Secure Login</h2>
            <p className="login-brand-subtitle mb-0">Dedicated administrator access portal</p>
          </div>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Admin Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Button className="w-100" variant="dark" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Login as Administrator'}
            </Button>
          </Form>

          {lockedMeta?.documentsRequired && (
            <div className="mt-4 p-3 border rounded" style={{ background: 'rgba(255,253,248,0.88)' }}>
              <h6 className="mb-2">Account Locked: Document Submission Required</h6>
              {lockedMeta.lockedUntil && (
                <p className="small text-muted mb-3">
                  Locked until: {new Date(lockedMeta.lockedUntil).toLocaleString()}
                </p>
              )}
              <Form onSubmit={handleUnlockSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label>Document Type</Form.Label>
                  <Form.Select
                    value={unlockForm.documentType}
                    onChange={(e) => setUnlockForm((prev) => ({ ...prev, documentType: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="official-id">Official ID Card</option>
                    <option value="deployment-letter">Deployment/Appointment Letter</option>
                    <option value="court-clearance">Court Clearance Memo</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Document Reference</Form.Label>
                  <Form.Control
                    value={unlockForm.documentReference}
                    onChange={(e) => setUnlockForm((prev) => ({ ...prev, documentReference: e.target.value }))}
                    required
                    disabled={loading}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Explanation</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={unlockForm.explanation}
                    onChange={(e) => setUnlockForm((prev) => ({ ...prev, explanation: e.target.value }))}
                    required
                    disabled={loading}
                  />
                </Form.Group>
                <Button variant="outline-dark" type="submit" disabled={loading}>Submit Unlock Documents</Button>
              </Form>
            </div>
          )}

          <div className="text-center mt-3">
            <Link to="/login" className="text-decoration-none">Back to user login</Link>
          </div>
        </Card.Body>
      </Card>
      </Container>
    </div>
  );
};

export default AdminLogin;
