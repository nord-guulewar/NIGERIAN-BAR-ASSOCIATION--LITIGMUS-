import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import './ConfirmAccount.css';

const ConfirmAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const confirm = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Account confirmation link is missing. Please request a new confirmation email.');
        return;
      }

      try {
        const response = await authAPI.confirmEmail(token);
        setStatus('success');
        setMessage(response.data.message || 'Your account has been confirmed. Welcome to NBA LITIGMUS.');
        setEmail(response.data.data?.user?.email || '');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'We could not confirm your account. The link may be expired or invalid.');
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="confirm-account-page">
      <Container>
        <Card className="confirm-account-card">
          <Card.Body className="p-4 p-md-5">
            <div className="confirm-icon">
              {status === 'loading' && <Spinner animation="border" variant="primary" />}
              {status === 'success' && <CheckCircle size={48} />}
              {status === 'error' && <XCircle size={48} />}
            </div>

            {status === 'loading' && (
              <>
                <h1>Confirming your account</h1>
                <p>Please wait while we verify your NBA LITIGMUS account.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <ShieldCheck size={42} className="confirm-success-icon" />
                <h1>Welcome to NBA LITIGMUS</h1>
                <p className="lead">
                  Your account has been confirmed successfully. You can now log in securely using your email and password.
                </p>
                {email && <Alert variant="success">Confirmed email: {email}</Alert>}
                <Alert variant="info">
                  <strong>Security reminder:</strong> use a strong password, never share your login details, and complete
                  two-factor verification whenever prompted.
                </Alert>
                <div className="confirm-actions">
                  <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
                    Continue to Login
                  </Button>
                  <Button variant="outline-secondary" size="lg" onClick={() => navigate('/')}>
                    Back to Home
                  </Button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <h1>Account confirmation failed</h1>
                <Alert variant="danger">{message}</Alert>
                <div className="confirm-actions">
                  <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
                    Go to Login
                  </Button>
                  <Button variant="outline-secondary" size="lg" onClick={() => navigate('/')}>
                    Back to Home
                  </Button>
                </div>
              </>
            )}

            {status !== 'success' && status !== 'error' && message && (
              <Alert variant="info">{message}</Alert>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ConfirmAccount;
