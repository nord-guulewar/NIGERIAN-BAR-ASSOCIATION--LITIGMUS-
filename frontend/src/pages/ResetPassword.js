import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState('verify'); // verify or reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userData, setUserData] = useState(null);

  // Verify token on mount
  useEffect(() => {
    if (token && email) {
      verifyToken();
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const verifyToken = async () => {
    setLoading(true);
    try {
      const response = await authAPI.verifyResetToken({ token, email });
      if (response.data.success) {
        setUserData(response.data.data);
        setStep('reset');
        setError('');
      } else {
        setError(response.data.message || 'Invalid reset token');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({
        token,
        email,
        newPassword,
        confirmPassword
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'verify') {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Verifying reset link...</p>
        </div>
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
            <Lock size={32} className="me-2" />
            <h2 className="mb-0">Reset Password</h2>
          </div>
          <small>Create a new secure password for your account</small>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Errors */}
          {error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <span className="me-2">⚠️</span>
              {error}
            </Alert>
          )}

          {/* Success */}
          {success && (
            <Alert variant="success" className="d-flex align-items-center">
              <CheckCircle size={20} className="me-2" />
              {success}
            </Alert>
          )}

          {step === 'reset' && userData ? (
            <Form onSubmit={handleResetPassword}>
              {/* User Info Display */}
              <div className="alert alert-info mb-3">
                <strong>Hello, {userData.firstName}!</strong>
                <p className="mb-0 small">Resetting password for: {email}</p>
              </div>

              {/* New Password */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">New Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    disabled={loading}
                    className="pe-4"
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </Form.Group>

              {/* Confirm Password */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Confirm Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="pe-4"
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </Form.Group>

              {/* Password Requirements */}
              <div className="alert alert-light border mb-3">
                <small className="fw-semibold">Password Requirements:</small>
                <ul className="mb-0 mt-2" style={{ fontSize: '13px' }}>
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase letter (A-Z)</li>
                  <li>Contains lowercase letter (a-z)</li>
                  <li>Contains number (0-9)</li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                variant="danger"
                type="submit"
                className="w-100 fw-semibold py-2"
                disabled={loading || !newPassword || !confirmPassword}
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
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </Form>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3">Verifying your reset link...</p>
            </div>
          )}
        </Card.Body>

        {/* Footer */}
        <Card.Footer className="bg-light py-3 text-center">
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

export default ResetPassword;
