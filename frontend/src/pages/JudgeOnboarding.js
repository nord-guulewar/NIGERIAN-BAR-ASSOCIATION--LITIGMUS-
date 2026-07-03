import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Gavel, ShieldCheck, UserCheck,
   FileCheck, CalendarCheck, Mail } from 'lucide-react';
import './JudgeOnboarding.css';

const JudgeOnboarding = () => {
  const navigate = useNavigate();

  const requirements = [
    { icon: <UserCheck size={22} />, title: 'Verified judicial identity', text: 'A valid judicial appointment letter, staff ID, or official court assignment must be verified before dashboard activation.' },
    { icon: <FileCheck size={22} />, title: 'Court assignment details', text: 'Judges must be assigned to a court, state, division, and jurisdiction scope before case access is enabled.' },
    { icon: <ShieldCheck size={22} />, title: 'Security clearance', text: 'Two-factor authentication, strong password policy, and periodic session renewal are required for judicial access.' },
    { icon: <CalendarCheck size={22} />, title: 'Case workflow readiness', text: 'Judges receive controlled access to assigned cases, judgments, adjournments, transfers, calendar events, and staff notifications.' }
  ];

  const steps = [
    'Submit judicial credentials and court assignment information for administrator review.',
    'Confirm your email using the secure confirmation link sent after account creation.',
    'Complete two-factor verification before accessing the Judge Dashboard.',
    'Review security obligations, NDPR responsibilities, and audit trail rules.',
    'Activate dashboard access only after administrator approval and identity verification.'
  ];

  return (
    <div className="judge-onboarding-page">
      <section className="judge-hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={7}>
              <Badge className="judge-hero-badge">
                <Gavel size={18} />
                Judicial Officer Onboarding
              </Badge>
              <h1>Welcome, Honorable Judge</h1>
              <p className="judge-hero-description">
                NBA LITIGMUS provides a secure, role-specific workspace for judicial officers to manage assigned cases,
                deliver judgments, adjourn hearings, transfer matters, and communicate with authorized court staff.
              </p>
              <div className="judge-hero-actions">
                <Button variant="light" size="lg" onClick={() => navigate('/judge-register')}>
                  Register as Judge
                </Button>
                <Button variant="outline-light" size="lg" onClick={() => navigate('/judge-login')}>
                  Judge Login
                </Button>
                <Button variant="outline-light" size="lg" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </Col>
            <Col lg={5}>
              <Card className="judge-welcome-card">
                <Card.Body>
                  <Mail size={32} className="judge-welcome-icon" />
                  <h2>Secure judicial access starts here</h2>
                  <p>
                    Judicial onboarding is separate from general staff registration. Complete the judge registration form,
                    confirm your judicial email, then use the dedicated judge login to access your secure dashboard.
                  </p>
                  <ul className="judge-welcome-list">
                    <li>Role-specific dashboard access</li>
                    <li>Email confirmation before login</li>
                    <li>Two-factor authentication</li>
                    <li>Audit trail for sensitive actions</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="judge-section">
        <Container>
          <div className="section-heading">
            <span>Onboarding Requirements</span>
            <h2>Vital information for judicial officers</h2>
            <p>
              Judges are granted privileged access to sensitive case data. Onboarding ensures every judicial user is
              verified, authorized, and accountable before using the system.
            </p>
          </div>

          <Row className="g-4">
            {requirements.map((item, index) => (
              <Col md={6} lg={3} key={index}>
                <Card className="judge-info-card">
                  <Card.Body>
                    <div className="judge-card-icon">{item.icon}</div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="judge-section judge-steps-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={5}>
              <div className="section-heading text-start">
                <span>Judge Onboarding Flow</span>
                <h2>How judicial access is activated</h2>
                <p>
                  The onboarding process separates judicial registration from general staff registration to reduce
                  impersonation risk and protect sensitive court records.
                </p>
              </div>
            </Col>
            <Col lg={7}>
              <Card className="judge-steps-card">
                <Card.Body>
                  <ol className="judge-steps-list">
                    {steps.map((step, index) => (
                      <li key={index}>
                        <span>{index + 1}</span>
                        <p>{step}</p>
                      </li>
                    ))}
                  </ol>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="judge-security-section">
        <Container>
          <div className="section-heading text-center">
            <span>Security Commitment</span>
            <h2>Judge Dashboard protection measures</h2>
            <p>
              Judicial actions are protected with fresh-session checks, role authorization, email confirmation,
              two-factor login verification, rate limiting, and audit logging.
            </p>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <Card className="judge-security-card">
                <Card.Body>
                  <ShieldCheck size={32} />
                  <h3>Verified accounts only</h3>
                  <p>All users must confirm their email before login. Judge accounts require administrator-controlled onboarding.</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="judge-security-card">
                <Card.Body>
                  <FileCheck size={32} />
                  <h3>Sensitive action audit</h3>
                  <p>Judgment delivery, adjournments, transfers, notes, notifications, calendar events, and fines are audited.</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="judge-security-card">
                <Card.Body>
                  <CalendarCheck size={32} />
                  <h3>Fresh session checks</h3>
                  <p>Judge dashboard actions require a recent authenticated session to reduce risk from stolen tokens.</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default JudgeOnboarding;