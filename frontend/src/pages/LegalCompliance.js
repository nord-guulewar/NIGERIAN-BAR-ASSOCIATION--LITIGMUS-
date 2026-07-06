import React from 'react';
import { Container, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PolicyLinks from '../components/PolicyLinks';
import { policyDocuments } from '../utils/policyDocuments';

const LegalCompliance = () => {
  const navigate = useNavigate();

  return (
    <Container className="py-4 py-md-5 legal-compliance-page">
      <Card className="border-0 shadow-sm legal-compliance-shell">
        <Card.Body className="p-4 p-md-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <Badge bg="success" className="mb-2 legal-compliance-badge">Legal and Compliance</Badge>
              <h1 className="mb-2">Legal, Privacy, and Governance</h1>
              <p className="text-muted mb-0">
                NBA LITIGMUS operates within Nigerian legal and court-administration workflows and supports privacy,
                security, and governance expectations for Nigerian and international users where applicable.
              </p>
            </div>
            <Button variant="outline-success" className="legal-compliance-action" onClick={() => navigate('/privacy')}>
              View Privacy Policy
            </Button>
          </div>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="h-100 border-0 legal-compliance-panel">
                <Card.Body>
                  <h5>Core Compliance Position</h5>
                  <p className="mb-0 text-muted">
                    The platform is primarily governed by Nigerian legal and data protection obligations, including the
                    Nigeria Data Protection Act 2023 and the NDPR, while also recognizing that GDPR or CCPA/CPRA may
                    apply in specific cross-border or user-jurisdiction scenarios.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 border-0 legal-compliance-panel">
                <Card.Body>
                  <h5>User Rights and Accountability</h5>
                  <p className="mb-0 text-muted">
                    Users and data subjects may have rights of access, correction, deletion, restriction, and complaint,
                    subject to court-record retention duties, judicial confidentiality, security requirements, and other
                    lawful limitations.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <PolicyLinks className="mb-4" />

          <h4 className="mb-3">Policy Set</h4>
          <Row className="g-4">
            {policyDocuments.map((policy) => (
              <Col md={6} lg={4} key={policy.title}>
                <Card className="h-100 border-0 shadow-sm legal-compliance-policy-card">
                  <Card.Body className="d-flex flex-column">
                    <h5>{policy.title}</h5>
                    <p className="text-muted flex-grow-1 mb-3">{policy.summary}</p>
                    <Button variant="link" className="p-0 text-decoration-none align-self-start legal-compliance-link" onClick={() => navigate(policy.route)}>
                      Open policy
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LegalCompliance;
