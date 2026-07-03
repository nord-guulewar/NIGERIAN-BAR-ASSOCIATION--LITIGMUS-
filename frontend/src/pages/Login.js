import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { KeyRound, LogIn, ShieldCheck, ShieldEllipsis, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSessionUser } from '../utils/sessionAuth';
import { authAPI, stateAPI, courtAPI, lgaAPI } from '../services/api';
import { isFirebaseConfigured } from '../services/firebase';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [courts, setCourts] = useState([]);
  const [lgas, setLgas] = useState([]);
  const { loginStep1, verifyLoginCode, resendVerificationCode, register, recoveryLogin } = useAuth();
  const navigate = useNavigate();

  const [showVerification, setShowVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const [recoveryInfo, setRecoveryInfo] = useState(null);

  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'clerk',
    phoneNumber: '',
    state: '',
    lga: '',
    court: '',
    courtDivision: 'Main',
    department: 'Registry',
    privacyAccept: false
  });

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const isReload = navigationEntry?.type === 'reload' || performance.navigation?.type === 1;
    const lastPathBeforeReload = sessionStorage.getItem('lastPathBeforeReload');

    // Redirect only when the browser was refreshed while already on /login.
    if (isReload && lastPathBeforeReload === '/login') {
      sessionStorage.removeItem('lastPathBeforeReload');
      navigate('/', { replace: true });
      return;
    }

    const rememberPathOnReload = () => {
      sessionStorage.setItem('lastPathBeforeReload', window.location.pathname);
    };

    window.addEventListener('beforeunload', rememberPathOnReload);
    return () => window.removeEventListener('beforeunload', rememberPathOnReload);
  }, [navigate]);

  useEffect(() => {
    fetchStates();
    fetchCourts();
  }, []);

  const fetchStates = async () => {
    try {
      console.log('Fetching states...');
      const response = await stateAPI.getAll();
      console.log('States response:', response.data);
      setStates(response.data.data.states);
      console.log('States loaded:', response.data.data.states.length);
    } catch (err) {
      console.error('Failed to fetch states:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load states. Please check if backend is running.');
    }
  };

  const fetchCourts = async () => {
    try {
      const response = await courtAPI.getAll();
      setCourts(response.data.data.courts);
    } catch (err) {
      console.error('Failed to fetch courts');
    }
  };

  const fetchLGAsByState = async (stateCode) => {
    try {
      console.log('Fetching LGAs for state:', stateCode);
      const response = await lgaAPI.getByState(stateCode);
      console.log('LGAs response:', response.data);
      setLgas(response.data.data.lgas);
      console.log('LGAs loaded:', response.data.data.lgas.length);
    } catch (err) {
      console.error('Failed to fetch LGAs:', err);
      console.error('Error details:', err.response?.data || err.message);
      setLgas([]);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const result = await loginStep1(email, password);

    if (result.success) {
      setPendingUserId(result.data?.userId || null);
      setMaskedEmail(result.data?.phoneNumber || email);
      setVerificationCode('');
      setShowVerification(true);
      setMessage(`Verification code sent via ${(result.data?.method || 'email').toUpperCase()}.`);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyLoginCode(pendingUserId, verificationCode);

if (result.success) {
  const userData = getSessionUser();
        const userRole = userData?.role;
        const dashboardRoutes = {
          'judge': '/judge-dashboard',
          'Justice': '/judge-dashboard',
          'Magistrate': '/judge-dashboard',
          'Chief Magistrate': '/judge-dashboard',
          'registrar': '/registrar-dashboard',
          'secretary': '/secretary-dashboard',
          'clerk': '/clerk-dashboard',
          'cashier': '/cashier-dashboard',
          'accountant': '/accountant-dashboard',
          'bailiff': '/bailiff-dashboard',
          'secretary': '/secretary-dashboard',
          'admin': '/admin-dashboard',
          'record_officer': '/records-dashboard',
          'court_reporter': '/court-reporter-dashboard',
          'usher': '/usher-dashboard',
          'security': '/security-dashboard',
          'librarian': '/librarian-dashboard',
          'litigation': '/litigation-dashboard',
          'prosecutor': '/prosecutor-dashboard',
          'probate': '/probate-dashboard'
        };
        navigate(dashboardRoutes[userRole] || '/');
      } else {
        setError(result.message);
      }

    setLoading(false);
  };

   const handleResendCode = async () => {
     setLoading(true);
     const result = await resendVerificationCode(pendingUserId, 'email');
     if (result.success) {
       setError('');
       alert('New code sent via EMAIL');
     } else {
       setError(result.message);
     }
     setLoading(false);
   };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!registerData.privacyAccept) {
      setError('Please accept the Privacy Policy to continue');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, privacyAccept, ...userData } = registerData;
      const result = await register(userData);

      if (result.success) {
        setMessage(
          result.emailConfirmationRequired
            ? 'Registration successful. Please check your email for the account confirmation link to complete your welcome onboarding.'
            : 'Registration successful. You can now log in.'
        );
        setRecoveryInfo(result.recoveryCode ? { recoveryCode: result.recoveryCode, offsiteAccess: result.offsiteAccess } : null);
        setRegisterData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'clerk',
          phoneNumber: '',
          state: '',
          lga: '',
          court: '',
          courtDivision: 'Main',
          department: 'Registry',
          privacyAccept: false
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'state' && value) {
      fetchLGAsByState(value);
      setRegisterData(prev => ({ ...prev, lga: '' }));
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await recoveryLogin(recoveryIdentifier.trim(), recoveryCode.trim());
      if (result.success) {
        const userData = getSessionUser();
        const userRole = userData?.role;
        const dashboardRoutes = {
          judge: '/judge-dashboard',
          registrar: '/registrar-dashboard',
          secretary: '/secretary-dashboard',
          clerk: '/clerk-dashboard',
          cashier: '/cashier-dashboard',
          accountant: '/accountant-dashboard',
          bailiff: '/bailiff-dashboard',
          secretary: '/secretary-dashboard',
          admin: '/admin-dashboard',
          record_officer: '/records-dashboard',
          court_reporter: '/court-reporter-dashboard',
          usher: '/usher-dashboard',
          security: '/security-dashboard',
          librarian: '/librarian-dashboard',
          litigation: '/litigation-dashboard',
          prosecutor: '/prosecutor-dashboard',
          probate: '/probate-dashboard'
        };
        navigate(dashboardRoutes[userRole] || '/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Recovery login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Container>
        <Card className="login-card mx-auto">
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <div className="login-brand-mark">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="12" r="4" fill="white"/>
                  <rect x="28" y="11" width="8" height="1.5" fill="white"/>
                  <path d="M32 16 L28 20 L26 32 L26 42 L28 44 L36 44 L38 42 L38 32 L36 20 Z" fill="white"/>
                  <line x1="28" y1="20" x2="20" y2="24" stroke="white" strokeWidth="1.5"/>
                  <line x1="36" y1="20" x2="44" y2="24" stroke="white" strokeWidth="1.5"/>
                  <circle cx="16" cy="24" r="3" fill="none" stroke="#d4af37" strokeWidth="1"/>
                  <line x1="13" y1="24" x2="19" y2="24" stroke="#d4af37" strokeWidth="1"/>
                  <circle cx="24" cy="24" r="3" fill="none" stroke="#d4af37" strokeWidth="1"/>
                  <line x1="21" y1="24" x2="27" y2="24" stroke="#d4af37" strokeWidth="1"/>
                  <line x1="16" y1="24" x2="24" y2="24" stroke="#d4af37" strokeWidth="1.5"/>
                  <line x1="20" y1="24" x2="20" y2="26" stroke="#d4af37" strokeWidth="1"/>
                  <line x1="44" y1="24" x2="44" y2="38" stroke="#d4af37" strokeWidth="2"/>
                  <rect x="42.5" y="22" width="3" height="3" fill="white"/>
                  <line x1="40" y1="24" x2="48" y2="24" stroke="#d4af37" strokeWidth="1.5"/>
                  <rect x="24" y="44" width="16" height="2" fill="white"/>
                  <path d="M22 46 L42 46 L40 48 L24 48 Z" fill="white"/>
                </svg>
              </div>
              <h2 className="login-brand-title mt-3 mb-2">NBA LITIGMUS</h2>
              <p className="login-brand-subtitle mb-0">Court operations and case management platform</p>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}

            {recoveryInfo && (
              <Alert variant="warning" className="recovery-info">
                <Alert.Heading><KeyRound size={18} className="me-2" /> Recovery Credentials (save these)</Alert.Heading>
                <div className="mb-2"><strong>Recovery Code:</strong> <code>{recoveryInfo.recoveryCode}</code></div>
                {recoveryInfo.offsiteAccess?.expiresAt && (
                  <div className="small text-muted mb-2">Expires: {new Date(recoveryInfo.offsiteAccess.expiresAt).toLocaleString()}</div>
                )}
                <hr className="my-2" />
                <p className="small mb-0">{recoveryInfo.offsiteAccess?.instructions || 'Use your email or recovery code to access your account offline or if you forget your password.'}</p>
              </Alert>
            )}

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
              justify
            >
              <Tab eventKey="login" title="Login">
                {!showVerification ? (
                  <Form onSubmit={handleLoginSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
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
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <div className="text-end mt-2">
                        <a href="/forgot-password" className="auth-link-inline text-decoration-none small">
                          Forgot Password?
                        </a>
                      </div>
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100"
                      disabled={loading}
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
                          Sending verification code...
                        </>
                      ) : (
                        <>
                          <LogIn size={18} className="me-2" />
                          Send Verification Code
                        </>
                      )}
                    </Button>

                    <div className="text-center mt-3">
                      {isFirebaseConfigured && (
                        <p className="small auth-helper-note mb-2">
                          Firebase sign-in is enabled. Your account must still exist in LITIGMUS for role-based access.
                        </p>
                      )}
                      <a href="/admin-login" className="text-decoration-none small text-dark">
                        Administrator? Use secure admin login
                      </a>
                    </div>
                  </Form>
                ) : (
                  <Form onSubmit={handleVerifySubmit}>
                    <div className="text-center mb-3">
                       <div className="login-verification-badge">
                         <ShieldEllipsis size={28} />
                       </div>
                       <h5>Verify Your Identity</h5>
                       <p className="small auth-helper-note">
                         A 6-digit code has been sent to the email contact linked to <strong>{maskedEmail}</strong>
                       </p>
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
                        className="login-otp-input"
                      />
                    </Form.Group>

                    <Button
                      variant="success"
                      type="submit"
                      className="w-100 mb-2"
                      disabled={loading || verificationCode.length !== 6}
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
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={18} className="me-2" />
                          Verify & Login
                        </>
                      )}
                    </Button>

                    <div className="d-flex justify-content-between">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleResendCode}
                        disabled={loading}
                        className="p-0"
                      >
                        Resend Code
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setShowVerification(false);
                          setVerificationCode('');
                          setError('');
                        }}
                        disabled={loading}
                        className="p-0 text-danger"
                      >
                        Use Different Account
                      </Button>
                    </div>
                  </Form>
                )}
              </Tab>

              <Tab eventKey="register" title="Register">
                <Form onSubmit={handleRegisterSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={registerData.firstName}
                          onChange={handleRegisterChange}
                          required
                          disabled={loading}
                          placeholder="Enter first name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={registerData.lastName}
                          onChange={handleRegisterChange}
                          required
                          disabled={loading}
                          placeholder="Enter last name"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Email Address <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                      disabled={loading}
                      placeholder="Enter email address"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="tel"
                      name="phoneNumber"
                      value={registerData.phoneNumber}
                      onChange={handleRegisterChange}
                      required
                      disabled={loading}
                      placeholder="e.g., 08012345678"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Role <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="role"
                      value={registerData.role}
                      onChange={handleRegisterChange}
                      required
                      disabled={loading}
                    >
                      <option value="clerk">Court Clerk</option>
                      <option value="registrar">Court Registrar</option>
                      <option value="cashier">Cashier</option>
                      <option value="accountant">Accountant</option>
                      <option value="litigation">Litigation Officer</option>
                      <option value="prosecutor">Public Prosecutor</option>
                      <option value="probate">Probate Officer</option>
                      <option value="record_officer">Records Officer</option>
                      <option value="court_reporter">Court Reporter</option>
                      <option value="bailiff">Bailiff</option>
                      <option value="secretary">Secretary</option>
                      <option value="usher">Court Usher</option>
                      <option value="security">Security Officer</option>
                      <option value="librarian">Law Librarian</option>
                      <option value="admin">Administrator</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Judges should use the dedicated Judge Onboarding page from the landing page.
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="state"
                          value={registerData.state}
                          onChange={handleRegisterChange}
                          required
                          disabled={loading}
                        >
                          <option value="">Select state</option>
                          {states.map(state => (
                            <option key={state.code} value={state.code}>{state.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Local Government <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="lga"
                          value={registerData.lga}
                          onChange={handleRegisterChange}
                          required={registerData.role !== 'admin'}
                          disabled={loading || !registerData.state}
                        >
                          <option value="">Select LGA</option>
                          {lgas.map((lga, index) => (
                            <option key={index} value={lga}>{lga}</option>
                          ))}
                        </Form.Select>
                        {!registerData.state && (
                          <Form.Text className="text-muted">
                            Please select a state first
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Court Type <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="court"
                          value={registerData.court}
                          onChange={handleRegisterChange}
                          required
                          disabled={loading}
                        >
                          <option value="">Select court</option>
                          {courts.map(court => (
                            <option key={court.code} value={court.code}>{court.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Court Division</Form.Label>
                        <Form.Select
                          name="courtDivision"
                          value={registerData.courtDivision}
                          onChange={handleRegisterChange}
                          disabled={loading}
                        >
                          <option value="Main">Main Court</option>
                          <option value="Magisterial District">Magisterial District</option>
                          <option value="Area Court">Area Court</option>
                          <option value="Customary Court">Customary Court</option>
                          <option value="Sharia Court">Sharia Court</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Select
                      name="department"
                      value={registerData.department}
                      onChange={handleRegisterChange}
                      disabled={loading}
                    >
                      <option value="Registry">Registry</option>
                      <option value="Civil">Civil</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Family">Family</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Land">Land</option>
                      <option value="Probate">Probate</option>
                      <option value="Appeal">Appeal</option>
                      <option value="Accounts">Accounts</option>
                      <option value="Records">Records</option>
                      <option value="Library">Library</option>
                      <option value="Administration">Administration</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Legal Credentials - Only for Judge, Registrar, Litigation, Prosecutor */}
                  {['judge', 'registrar', 'litigation', 'prosecutor'].includes(registerData.role) && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Bar Admission Year <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            name="barAdmissionYear"
                            value={registerData.barAdmissionYear || ''}
                            onChange={handleRegisterChange}
                            required
                            disabled={loading}
                            placeholder="e.g., 2015"
                            min="1960"
                            max={new Date().getFullYear()}
                          />
                          <Form.Text className="text-muted">
                            Year you were called to the Nigerian Bar
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Supreme Court Number <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="supremeCourtNumber"
                            value={registerData.supremeCourtNumber || ''}
                            onChange={handleRegisterChange}
                            required
                            disabled={loading}
                            placeholder="SC/12345/2020"
                            pattern="SC/\d+/\d{4}"
                          />
                          <Form.Text className="text-muted">
                            Format: SC/NUMBER/YEAR
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          required
                          disabled={loading}
                          placeholder="Min. 6 characters"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          required
                          disabled={loading}
                          placeholder="Re-enter password"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="privacyAccept"
                      name="privacyAccept"
                      checked={registerData.privacyAccept || false}
                      onChange={handleRegisterChange}
                      required
                      label={
                        <span>
                          I have read and agree to the{' '}
                          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                        </span>
                      }
                      disabled={loading}
                    />
                  </Form.Group>

                  <Button
                    variant="success"
                    type="submit"
                    className="w-100"
                    disabled={loading}
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
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} className="me-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </Form>
              </Tab>

              <Tab eventKey="recovery" title="Offline Recovery">
                <Form onSubmit={handleRecoverySubmit}>
                  <Alert variant="info" className="mb-3">
                    Use this tab if you forgot your password but have your recovery code.
                  </Alert>
                  <Form.Group className="mb-3">
                    <Form.Label>Email or Staff ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="judge@court.gov.ng or STAFF-123"
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label>Recovery Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="NBA-..."
                    />
                  </Form.Group>
                  <Button variant="warning" type="submit" className="w-100" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Verifying recovery...
                      </>
                    ) : (
                      <>
                        <KeyRound className="me-2" />
                        Recover & Login
                      </>
                    )}
                  </Button>
                </Form>
              </Tab>
            </Tabs>

            <div className="text-center mt-4">
              <small className="auth-footer-note">
                <ShieldCheck size={14} />
                Nigerian Bar Association &copy; 2026
              </small>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Login;
