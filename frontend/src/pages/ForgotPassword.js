import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.forgotPassword(email);
      
      if (response.data.success) {
        setSuccess(true);
        setSubmitted(true);
        setEmail('');
      } else {
        setError(response.data.message || 'Failed to process request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && success) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100 py-4">
        <Card className="shadow-lg text-center" style={{ maxWidth: '500px', width: '100%' }}>
          <Card.Body className="p-5">
            <div className="mb-4">
              <div className="display-1" style={{ color: '#c41e3a' }}>
                <CheckCircle size={80} />
              </div>
            </div>
            
            <h2 className="mb-3">Check Your Email</h2>
            <p className="text-muted mb-4">
              We've sent a password reset link to<br/>
              <strong>{email || 'your email'}</strong>
            </p>

            <Alert variant="info" className="text-start">
              <strong>What to do next:</strong>
              <ul className="mb-0 mt-2">
                <li>Check your email (including spam folder)</li>
                <li>Click the reset link (expires in 1 hour)</li>
                <li>Create a new password</li>
                <li>Log in with your new password</li>
              </ul>
            </Alert>

            <div className="d-grid gap-2">
              <Button
                variant="outline-danger"
                onClick={() => navigate('/login')}
                className="d-flex align-items-center justify-content-center"
              >
                <ArrowLeft size={18} className="me-2" />
                Back to Login
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-4">
      <Card className="shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        {/* Header */}
        <Card.Header className="bg-gradient text-white text-center py-4" style={{ 
          background: 'linear-gradient(135deg, #1a472a 0%, #c41e3a 100%)',
          borderRadius: '0'
        }}>
          <div className="d-flex align-items-center justify-content-center mb-2">
            <Mail size={32} className="me-2" />
            <h2 className="mb-0">Forgot Password?</h2>
          </div>
          <small>No worries! We'll help you reset it.</small>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Errors */}
          {error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <span className="me-2">⚠️</span>
              {error}
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert variant="success" className="d-flex align-items-center">
              <CheckCircle size={20} className="me-2" />
              Password reset link sent successfully!
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Info Box */}
            <div className="alert alert-info border mb-4">
              <p className="mb-0 small">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Email Input */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Email Address</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                disabled={loading}
                required
              />
              <Form.Text className="text-muted">
                We'll send a reset link to this email
              </Form.Text>
            </Form.Group>

            {/* Submit Button */}
            <Button
              variant="danger"
              type="submit"
              className="w-100 fw-semibold py-2 mb-3"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </Form>
        </Card.Body>

        {/* Footer */}
        <Card.Footer className="py-3 text-center">
          <button
            className="btn btn-link text-decoration-none d-inline-flex align-items-center"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft size={16} className="me-2" />
            Back to Login
          </button>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
