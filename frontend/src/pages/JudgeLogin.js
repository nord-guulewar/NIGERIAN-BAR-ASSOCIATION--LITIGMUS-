import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, Tabs, Tab, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Gavel, ShieldCheck, BadgeCheck, Mail, KeyRound } from 'lucide-react';
import { authAPI } from '../services/api';
import './JudgeLogin.css';

const JudgeLogin = () => {
  const navigate = useNavigate();
  const { judgeLoginStep1, judgeVerifyLoginCode, judgeResendVerificationCode } = useAuth();

  const [loginTab, setLoginTab] = useState('email');
  const [email, setEmail] = useState('');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);
  const [maskedIdentifier, setMaskedIdentifier] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const identifier = loginTab === 'staffId' ? staffId.trim() : email.trim();

    if (!identifier || !password) {
      setError(loginTab === 'staffId'
        ? 'Please provide your Staff ID and password'
        : 'Please provide your email and password'
      );
      setLoading(false);
      return;
    }

    try {
      const result = await judgeLoginStep1(identifier, password);

      if (result.success) {
        setPendingUserId(result.data.userId);
        setMaskedIdentifier(result.data.email || result.data.staffId || identifier);
        setShowVerification(true);
      } else {
        if (result.data && result.data.staffIdMismatch) {
          setError('This Staff ID does not belong to you. Each Staff ID is uniquely assigned to one judicial officer.');
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError('');
    setMessage('');

    const emailToUse = email.trim();
    if (!emailToUse) {
      setError('Enter your judicial email address first, then click resend confirmation.');
      return;
    }

    setResendingConfirmation(true);
    try {
      await authAPI.resendConfirmation(emailToUse);
      setMessage(`Confirmation email has been resent to ${emailToUse}. Check inbox and spam folder.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend confirmation email.');
    } finally {
      setResendingConfirmation(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await judgeVerifyLoginCode(pendingUserId, verificationCode);

    if (result.success) {
      navigate('/judge-dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleResendCode = async () => {
    setLoading(true);
    const result = await judgeResendVerificationCode(pendingUserId);

    if (result.success) {
      setError('');
      alert('New judge verification code sent via email');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const resetLogin = () => {
    setShowVerification(false);
    setVerificationCode('');
    setError('');
  };

  return (
    <div className="judge-login-page">
      <div className="judge-auth-scene" aria-hidden="true">
        <div className="judge-auth-scene-orb judge-auth-scene-orb-a"></div>
        <div className="judge-auth-scene-orb judge-auth-scene-orb-b"></div>
        <div className="judge-auth-scene-grid"></div>
        <div className="judge-auth-scene-icon judge-auth-scene-icon-gavel">
          <Gavel size={32} />
        </div>
        <div className="judge-auth-scene-icon judge-auth-scene-icon-shield">
          <ShieldCheck size={28} />
        </div>
        <div className="judge-auth-scene-icon judge-auth-scene-icon-badge">
          <BadgeCheck size={26} />
        </div>
      </div>
      <Container>
        <Card className="judge-login-card">
          <Card.Body className="p-4 p-md-5">
            <Row className="g-4 align-items-stretch">
              <Col lg={5}>
                <div className="judge-login-brand-panel h-100">
                  <div className="judge-login-brand text-start mb-4">
                    <span className="judge-login-eyebrow">Judicial Access Portal</span>
                    <div className="judge-login-logo">
                      <Gavel size={42} />
                    </div>
                    <h1>Judge Secure Login</h1>
                    <p>Fast access for judges and magistrates, with audit-backed verification and the same dark gold palette already used across the platform.</p>
                  </div>

                  <div className="judge-login-feature-list">
                    <div className="judge-login-feature-item">
                      <div className="judge-login-feature-icon"><Mail size={18} /></div>
                      <div>
                        <strong>Email verification</strong>
                        <span>Every session is confirmed before dashboard access.</span>
                      </div>
                    </div>
                    <div className="judge-login-feature-item">
                      <div className="judge-login-feature-icon"><ShieldCheck size={18} /></div>
                      <div>
                        <strong>Restricted portal</strong>
                        <span>Built only for dedicated judicial accounts and identity checks.</span>
                      </div>
                    </div>
                    <div className="judge-login-feature-item">
                      <div className="judge-login-feature-icon"><KeyRound size={18} /></div>
                      <div>
                        <strong>Dual entry options</strong>
                        <span>Sign in with your court email or issued Staff ID.</span>
                      </div>
                    </div>
                  </div>

                  <div className="judge-login-side-note">
                    <span className="judge-login-side-note-label">Need onboarding first?</span>
                    <Button variant="link" className="p-0" onClick={() => navigate('/judge-onboarding')}>View Judge Onboarding</Button>
                  </div>
                </div>
              </Col>

              <Col lg={7}>
                <div className="judge-login-form-panel">
                  {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                  {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}

                  {!showVerification ? (
                    <>
                      <div className="judge-login-form-header">
                        <h2>Choose a sign-in route</h2>
                        <p>Keep the page focused on only the details needed to verify your judicial access.</p>
                      </div>

                      <Tabs
                        activeKey={loginTab}
                        onSelect={(k) => { setLoginTab(k); setError(''); }}
                        className="mb-4 judge-login-tabs"
                        justify
                      >
                        <Tab eventKey="email" title={<span><BadgeCheck size={16} className="me-1" />Email Login</span>}>
                          <Form onSubmit={handleLoginSubmit} className="mt-3">
                            <Form.Group className="mb-3">
                              <Form.Label>Judicial Email Address</Form.Label>
                              <Form.Control
                                type="email"
                                placeholder="judge@court.gov.ng"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required={loginTab === 'email'}
                                disabled={loading}
                              />
                            </Form.Group>
                            <Form.Group className="mb-4">
                              <Form.Label>Password</Form.Label>
                              <Form.Control
                                type="password"
                                placeholder="Enter judicial password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                              />
                            </Form.Group>
                            <Button variant="primary" type="submit" className="w-100 judge-auth-action-button" disabled={loading}>
                              {loading ? <><Spinner animation="border" size="sm" className="me-2" />Sending Code...</> : 'Send Verification Code'}
                            </Button>
                          </Form>
                        </Tab>

                        <Tab eventKey="staffId" title={<span><ShieldCheck size={16} className="me-1" />Staff ID Login</span>}>
                          <Form onSubmit={handleLoginSubmit} className="mt-3">
                            <Form.Group className="mb-3">
                              <Form.Label>Staff ID</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="e.g., JUS-SC-ABU-2026-0001"
                                value={staffId}
                                onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                                required={loginTab === 'staffId'}
                                disabled={loading}
                                style={{ letterSpacing: '0.5px', fontFamily: 'monospace' }}
                              />
                              <Form.Text className="text-muted">
                                Enter the unique Staff ID issued during judicial registration.
                              </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-4">
                              <Form.Label>Password</Form.Label>
                              <Form.Control
                                type="password"
                                placeholder="Enter judicial password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                              />
                            </Form.Group>
                            <Button variant="primary" type="submit" className="w-100 judge-auth-action-button" disabled={loading}>
                              {loading ? <><Spinner animation="border" size="sm" className="me-2" />Sending Code...</> : 'Send Verification Code'}
                            </Button>
                          </Form>
                        </Tab>
                      </Tabs>

                      <div className="judge-confirmation-help mt-3">
                        <p className="mb-2">Did not receive your judge confirmation email?</p>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleResendConfirmation}
                          disabled={resendingConfirmation}
                        >
                          {resendingConfirmation ? (
                            <><Spinner animation="border" size="sm" className="me-2" />Resending...</>
                          ) : (
                            'Resend Confirmation Email'
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Form onSubmit={handleVerifySubmit}>
                      <div className="judge-verification-panel text-center mb-4">
                        <ShieldCheck size={48} />
                        <h2>Verify Judicial Access</h2>
                        <p>A 6-digit verification code has been sent to the email linked to <strong>{maskedIdentifier}</strong></p>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label>Verification Code</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          required
                          disabled={loading}
                          maxLength={6}
                          style={{ textAlign: 'center', fontSize: '1.35rem', letterSpacing: '0.55rem' }}
                        />
                      </Form.Group>
                      <Button variant="primary" type="submit" className="w-100 mb-2 judge-auth-action-button" disabled={loading || verificationCode.length !== 6}>
                        {loading ? <><Spinner animation="border" size="sm" className="me-2" />Verifying Judge Session</> : 'Verify & Enter Dashboard'}
                      </Button>

                      <div className="d-flex justify-content-between">
                        <Button variant="link" size="sm" onClick={handleResendCode} disabled={loading} className="p-0">
                          Resend Code
                        </Button>
                        <Button variant="link" size="sm" onClick={resetLogin} disabled={loading} className="p-0 text-danger">
                          Use Different Account
                        </Button>
                      </div>
                    </Form>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default JudgeLogin;
