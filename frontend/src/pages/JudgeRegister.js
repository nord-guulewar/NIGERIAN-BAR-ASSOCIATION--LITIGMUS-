import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { ShieldCheck, Copy, CheckCircle, Mail, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI, stateAPI, lgaAPI } from '../services/api';
import './JudgeRegister.css';

const VALID_COURTS_BY_TITLE = {
  Justice: [{ code: 'SC', name: 'Supreme Court of Nigeria' }],
  Judge: [
    { code: 'SHC', name: 'State High Court' },
    { code: 'FHC', name: 'Federal High Court' },
    { code: 'CA', name: 'Court of Appeal' },
    { code: 'SCA', name: 'Sharia Court of Appeal' },
    { code: 'CCA', name: 'Customary Court of Appeal' }
  ],
  'Chief Magistrate': [
    { code: 'MC', name: 'Magistrate Court' },
    { code: 'DC', name: 'District Court' }
  ],
  Magistrate: [
    { code: 'MC', name: 'Magistrate Court' },
    { code: 'DC', name: 'District Court' }
  ]
};

const initialJudgeData = {
  title: 'Judge',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  state: '',
  lga: '',
  court: '',
  courtDivision: 'Main',
  department: 'Administration',
  barAdmissionYear: '',
  supremeCourtNumber: '',
  barRegistrationNumber: '',
  staffId: '',
  dateOfEmployment: '',
  qualification: 'B.L',
  privacyAccept: false
};

const JudgeRegister = () => {
  const navigate = useNavigate();
  const { registerJudge } = useAuth();
  const [judgeData, setJudgeData] = useState(initialJudgeData);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [recoveryInfo, setRecoveryInfo] = useState(null);

  const [barStep, setBarStep] = useState('form');
  const [barVerifying, setBarVerifying] = useState(false);
  const [barError, setBarError] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  const [staffIdCode, setStaffIdCode] = useState('');
  const [generatedStaffId, setGeneratedStaffId] = useState('');
  const [staffIdLoading, setStaffIdLoading] = useState(false);
  const [staffIdError, setStaffIdError] = useState('');
  const [staffIdCopied, setStaffIdCopied] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await stateAPI.getAll();
      setStates(response.data.data.states || []);
    } catch (err) {
      setError('Failed to load states. Please check if backend is running.');
    }
  };

  const fetchLGAsByState = async (stateCode) => {
    try {
      const response = await lgaAPI.getByState(stateCode);
      setLgas(response.data.data.lgas || []);
    } catch (err) {
      setLgas([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJudgeData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'state' && value) {
      fetchLGAsByState(value);
      setJudgeData(prev => ({ ...prev, lga: '' }));
    }
  };

  const handleBarVerifyAndSendCode = async () => {
    if (!judgeData.barRegistrationNumber || !/^SC\/\d+\/\d{4}$/.test(judgeData.barRegistrationNumber)) {
      setBarError('Please enter a valid bar registration number in format SC/NUMBER/YEAR.');
      return;
    }

    if (!judgeData.email) {
      setBarError('Please enter your email address. The Staff ID generation code will be sent there.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(judgeData.email)) {
      setBarError('Please provide a valid email address.');
      return;
    }

    if (!judgeData.title) {
      setBarError('Please select your judicial title.');
      return;
    }

    if (!judgeData.state) {
      setBarError('Please select your state.');
      return;
    }

    setBarVerifying(true);
    setBarError('');

    try {
      const response = await authAPI.verifyBarRegistration(
        judgeData.barRegistrationNumber,
        judgeData.email,
        {
          firstName: judgeData.firstName,
          lastName: judgeData.lastName,
          phoneNumber: judgeData.phoneNumber,
          title: judgeData.title,
          state: judgeData.state,
          lga: judgeData.lga
        }
      );

      if (response.data.success) {
        setVerificationToken(response.data.data.verificationToken);
        setMaskedEmail(response.data.data.email);
        setBarStep('code');
        if (response.data.data.demoCode) {
          setStaffIdCode(response.data.data.demoCode);
        }
      } else {
        setBarError(response.data.message || 'Bar registration verification failed.');
      }
    } catch (err) {
      setBarError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setBarVerifying(false);
    }
  };

  const handleGenerateStaffId = async () => {
    if (!staffIdCode || staffIdCode.length < 6) {
      setStaffIdError('Please enter the code sent to your email.');
      return;
    }

    setStaffIdLoading(true);
    setStaffIdError('');

    try {
      const response = await authAPI.generateStaffId(
        verificationToken,
        staffIdCode,
        judgeData.title,
        judgeData.state,
        judgeData.lga
      );

      if (response.data.success) {
        setGeneratedStaffId(response.data.data.staffId);
        setJudgeData(prev => ({ ...prev, staffId: response.data.data.staffId }));
        setBarStep('generated');
      } else {
        setStaffIdError(response.data.message || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setStaffIdError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setStaffIdLoading(false);
    }
  };

  const copyStaffId = () => {
    navigator.clipboard.writeText(generatedStaffId).then(() => {
      setStaffIdCopied(true);
      setTimeout(() => setStaffIdCopied(false), 2000);
    });
  };

  const resetBarFlow = () => {
    setBarStep('form');
    setVerificationToken('');
    setMaskedEmail('');
    setStaffIdCode('');
    setGeneratedStaffId('');
    setJudgeData(prev => ({ ...prev, staffId: '' }));
    setBarError('');
    setStaffIdError('');
  };

  const getValidCourtsForTitle = () => {
    return VALID_COURTS_BY_TITLE[judgeData.title] || [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setRecoveryInfo(null);

    if (!judgeData.staffId) {
      setError('Staff ID is mandatory. Please complete the bar verification and Staff ID generation above.');
      return;
    }

    if (judgeData.password !== judgeData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (judgeData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!judgeData.privacyAccept) {
      setError('Please accept the Privacy Policy and judicial code of conduct to continue');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, privacyAccept, ...payload } = judgeData;
      const result = await registerJudge(payload);

      if (result.success) {
        setMessage('Judge registration submitted. Confirm your judicial email first, then use the dedicated judge login portal to receive your verification code.');
        setRecoveryInfo(result.offsiteAccess || null);
        setJudgeData(initialJudgeData);
        setGeneratedStaffId('');
        setBarStep('form');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Judge registration failed. Please try again.');
      console.error('Judge registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="judge-register-page">
      <Container>
        <Card className="judge-register-card">
          <Card.Body className="p-4 p-md-5">
            <div className="judge-register-header text-center mb-4">
              <h1>Judicial Officer Registration</h1>
              <p>Secure onboarding for judges, magistrates, and judicial officers.</p>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}

            <Alert variant="warning" className="mb-4">
              Judicial accounts cannot use the standard staff login. After confirming your email, continue from the dedicated judge login page.
            </Alert>

            {/* ===== Bar Registration + Staff ID Panel ===== */}
            <Card className="staff-id-panel mb-4" style={{ borderColor: '#d4af37', borderWidth: 2 }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <ShieldCheck size={24} style={{ color: '#d4af37' }} className="me-2" />
                  <h4 className="mb-0">Bar Registration & Staff ID</h4>
                  <Badge bg={barStep === 'generated' ? 'success' : barStep === 'code' ? 'warning' : 'secondary'} className="ms-auto">
                    {barStep === 'generated' ? 'Staff ID Generated' : barStep === 'code' ? 'Code Sent' : 'Step 1 of 2'}
                  </Badge>
                </div>

                {/* Step 1: Enter bar reg number + email */}
                {barStep === 'form' && (
                  <div>
                    <p className="text-muted small mb-3">
                      Enter your Nigerian Bar re-registration number and email. A Staff ID generation code will be sent to your email.
                      Format: <code>SC/NUMBER/YEAR</code> (e.g., SC/1234/2015).
                    </p>
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Bar Re-registration Number <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="barRegistrationNumber"
                            value={judgeData.barRegistrationNumber}
                            onChange={handleChange}
                            placeholder="SC/1234/2015"
                            style={{ textTransform: 'uppercase' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Email Address <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={judgeData.email}
                            onChange={handleChange}
                            placeholder="Your email — code will be sent here"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="g-3 mb-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Judicial Title <span className="text-danger">*</span></Form.Label>
                          <Form.Select name="title" value={judgeData.title} onChange={handleChange}>
                            <option value="Judge">Judge</option>
                            <option value="Justice">Justice</option>
                            <option value="Chief Magistrate">Chief Magistrate</option>
                            <option value="Magistrate">Magistrate</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>State <span className="text-danger">*</span></Form.Label>
                          <Form.Select name="state" value={judgeData.state} onChange={handleChange}>
                            <option value="">Select state</option>
                            {states.map(state => (
                              <option key={state.code} value={state.code}>{state.name}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Local Government</Form.Label>
                          <Form.Select name="lga" value={judgeData.lga} onChange={handleChange} disabled={!judgeData.state}>
                            <option value="">Select LGA</option>
                            {lgas.map(lga => (
                              <option key={lga} value={lga}>{lga}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>First Name</Form.Label>
                          <Form.Control name="firstName" value={judgeData.firstName} onChange={handleChange} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control name="lastName" value={judgeData.lastName} onChange={handleChange} />
                        </Form.Group>
                      </Col>
                    </Row>

                    {barError && (
                      <Alert variant="warning" dismissible onClose={() => setBarError('')} className="py-2 small">
                        {barError}
                      </Alert>
                    )}

                    <Button
                      variant="primary"
                      onClick={handleBarVerifyAndSendCode}
                      disabled={barVerifying || !judgeData.barRegistrationNumber || !judgeData.email || !judgeData.title || !judgeData.state}
                    >
                      {barVerifying ? (
                        <><Spinner animation="border" size="sm" className="me-2" />Verifying & Sending Code...</>
                      ) : (
                        <><Mail size={16} className="me-2" />Verify Bar Registration & Send Code</>
                      )}
                    </Button>
                  </div>
                )}

                {/* Step 2: Enter code from email */}
                {barStep === 'code' && (
                  <div>
                    <Alert variant="success" className="py-2 small">
                      <CheckCircle size={16} className="me-2" />
                      Bar registration verified! A Staff ID generation code has been sent to <strong>{maskedEmail}</strong>.
                      Enter it below to generate your Staff ID.
                    </Alert>

                    <Row className="g-3 mb-3">
                      <Col md={8}>
                        <Form.Group>
                          <Form.Label>Staff ID Generation Code <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={staffIdCode}
                            onChange={(e) => setStaffIdCode(e.target.value.toUpperCase())}
                            placeholder="Enter code from email"
                            maxLength={16}
                            style={{ letterSpacing: '0.2rem', fontSize: '1.1rem' }}
                          />
                          <Form.Text className="text-muted">
                            Check your email for the 8-character code. It expires in 10 minutes.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={4} className="d-flex align-items-end">
                        <Button
                          variant="primary"
                          onClick={handleGenerateStaffId}
                          disabled={staffIdLoading || !staffIdCode}
                          className="w-100"
                        >
                          {staffIdLoading ? (
                            <><Spinner animation="border" size="sm" className="me-2" />Generating...</>
                          ) : (
                            <><KeyRound size={16} className="me-2" />Generate Staff ID</>
                          )}
                        </Button>
                      </Col>
                    </Row>

                    {staffIdError && (
                      <Alert variant="warning" dismissible onClose={() => setStaffIdError('')} className="py-2 small">
                        {staffIdError}
                      </Alert>
                    )}

                    <Button variant="link" size="sm" onClick={resetBarFlow} className="p-0">
                      ← Start over with different bar registration
                    </Button>
                  </div>
                )}

                {/* Step 3: Staff ID generated */}
                {barStep === 'generated' && generatedStaffId && (
                  <div>
                    <Alert variant="success" className="py-2 small">
                      <CheckCircle size={16} className="me-2" />
                      Your Staff ID has been generated successfully!
                    </Alert>
                    <div className="generated-id-display p-3" style={{ background: '#f8f9fa', borderRadius: 12, border: '2px solid #d4af37' }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <small className="text-muted d-block mb-1">Your Unique Staff ID</small>
                          <code className="fs-4 fw-bold" style={{ color: '#1a472a', letterSpacing: 2 }}>{generatedStaffId}</code>
                        </div>
                        <Button variant="light" size="sm" onClick={copyStaffId} title="Copy to clipboard">
                          {staffIdCopied ? <CheckCircle size={18} className="text-success" /> : <Copy size={18} />}
                        </Button>
                      </div>
                      <div className="mt-2 small text-muted">
                        <strong>Format:</strong> PREFIX-STATE-LG-RANDOM (completely different from your bar registration number)
                      </div>
                      <div className="mt-1 small text-warning">
                        <strong>Save this ID.</strong> It is unique to you and cannot be changed. You will need it to log in.
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button variant="outline-secondary" size="sm" onClick={resetBarFlow}>
                        Regenerate with different details
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* ===== Registration Form ===== */}
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Judicial Title</Form.Label>
                    <Form.Select name="title" value={judgeData.title} onChange={handleChange} required disabled={barStep !== 'form'}>
                      <option value="Judge">Judge</option>
                      <option value="Justice">Justice</option>
                      <option value="Magistrate">Magistrate</option>
                      <option value="Chief Magistrate">Chief Magistrate</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control name="firstName" value={judgeData.firstName} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control name="lastName" value={judgeData.lastName} onChange={handleChange} required />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control type="email" name="email" value={judgeData.email} onChange={handleChange} required disabled={barStep !== 'form'} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control type="tel" name="phoneNumber" value={judgeData.phoneNumber} onChange={handleChange} required />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" name="password" value={judgeData.password} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" name="confirmPassword" value={judgeData.confirmPassword} onChange={handleChange} required />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Select name="state" value={judgeData.state} onChange={handleChange} required disabled={barStep !== 'form'}>
                      <option value="">Select state</option>
                      {states.map(state => (
                        <option key={state.code} value={state.code}>{state.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Local Government</Form.Label>
                    <Form.Select name="lga" value={judgeData.lga} onChange={handleChange} required disabled={!judgeData.state || barStep !== 'form'}>
                      <option value="">Select LGA</option>
                      {lgas.map(lga => (
                        <option key={lga} value={lga}>{lga}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Court</Form.Label>
                    <Form.Select name="court" value={judgeData.court} onChange={handleChange} required>
                      <option value="">Select court</option>
                      {getValidCourtsForTitle().map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Court Division</Form.Label>
                    <Form.Select name="courtDivision" value={judgeData.courtDivision} onChange={handleChange}>
                      <option value="Main">Main Court</option>
                      <option value="Magisterial District">Magisterial District</option>
                      <option value="Area Court">Area Court</option>
                      <option value="Customary Court">Customary Court</option>
                      <option value="Sharia Court">Sharia Court</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Select name="department" value={judgeData.department} onChange={handleChange}>
                      <option value="Administration">Administration</option>
                      <option value="Civil">Civil</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Family">Family</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Land">Land</option>
                      <option value="Probate">Probate</option>
                      <option value="Appeal">Appeal</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Qualification</Form.Label>
                    <Form.Select name="qualification" value={judgeData.qualification} onChange={handleChange}>
                      <option value="LL.B">LL.B</option>
                      <option value="B.L">B.L</option>
                      <option value="LL.M">LL.M</option>
                      <option value="Ph.D">Ph.D</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bar Admission Year</Form.Label>
                    <Form.Control type="number" name="barAdmissionYear" value={judgeData.barAdmissionYear} onChange={handleChange} min="1960" max={new Date().getFullYear()} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Supreme Court Number</Form.Label>
                    <Form.Control name="supremeCourtNumber" value={judgeData.supremeCourtNumber} onChange={handleChange} placeholder="SC/12345/2020" required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Staff ID {barStep === 'generated' && <CheckCircle size={14} className="text-success ms-1" />}</Form.Label>
                    <Form.Control
                      name="staffId"
                      value={judgeData.staffId}
                      placeholder="Complete bar verification above"
                      readOnly
                      required
                      isInvalid={!judgeData.staffId}
                    />
                    <Form.Control.Feedback type="invalid">
                      Staff ID is mandatory. Complete the bar verification process above.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Date of Employment</Form.Label>
                <Form.Control type="date" name="dateOfEmployment" value={judgeData.dateOfEmployment} onChange={handleChange} />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  name="privacyAccept"
                  checked={judgeData.privacyAccept}
                  onChange={handleChange}
                  required
                  label={
                    <span>
                      I confirm that the information provided is accurate and I agree to the{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and judicial code of conduct.
                    </span>
                  }
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100" disabled={loading || !judgeData.staffId}>
                {loading ? <><Spinner animation="border" size="sm" className="me-2" />Submitting Judicial Registration</> : 'Submit Judicial Registration'}
              </Button>
            </Form>

            {recoveryInfo && (
              <Alert variant="warning" className="recovery-info mt-4">
                <Alert.Heading><ShieldCheck size={18} className="me-2" /> Offline Access Credentials (save these)</Alert.Heading>
                <div className="mb-2"><strong>Staff ID:</strong> <code>{recoveryInfo.staffId}</code></div>
                <div className="mb-2"><strong>Recovery Code:</strong> <code>{recoveryInfo.recoveryCode}</code></div>
                <div className="small text-muted mb-2">Expires: {new Date(recoveryInfo.expiresAt).toLocaleString()}</div>
                <hr className="my-2" />
                <p className="small mb-0">{recoveryInfo.instructions}</p>
              </Alert>
            )}

            <div className="judge-register-footer mt-4 text-center">
              <span>Already have a judicial account? </span>
              <Button variant="link" className="p-0" onClick={() => navigate('/judge-login')}>Login as Judge</Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default JudgeRegister;
