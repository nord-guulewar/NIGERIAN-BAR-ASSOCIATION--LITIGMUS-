import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PolicyLinks from '../components/PolicyLinks';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <Container className="py-4 py-md-5">
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4 p-md-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h1 className="mb-2">Privacy Policy</h1>
              <p className="text-muted mb-0">NBA LITIGMUS privacy notice for Nigerian and international users.</p>
            </div>
            <Button variant="outline-success" onClick={() => navigate('/legal-compliance')}>
              Legal & Compliance Overview
            </Button>
          </div>

          <PolicyLinks className="mb-4" />

          <div className="privacy-content" style={{ lineHeight: '1.8' }}>
            <h5>1. Introduction</h5>
            <p>
              NBA LITIGMUS ("we," "our," or "us") is a case management system developed for the
              <strong> Nigerian Bar Association (NBA)</strong> and related court operations. This Privacy Policy explains how we collect,
              use, store, and protect personal information in line with the
              <strong> Nigeria Data Protection Act 2023 (NDPA)</strong>, the
              <strong> Nigeria Data Protection Regulation (NDPR)</strong>, and, where applicable,
              <strong> GDPR</strong> and <strong>CCPA/CPRA</strong> requirements.
            </p>

            <h5 className="mt-4">2. Who This Policy Covers</h5>
            <p>
              This policy applies to users and data subjects regardless of nationality, descent, place of birth,
              citizenship, or naturalization status where their information is processed through NBA LITIGMUS.
              This includes Nigerian users and international persons whose data is processed in connection with Nigerian
              legal, court, administrative, or institutional workflows.
            </p>

            <h5 className="mt-4">3. Nigerian Data Protection Framework</h5>
            <p>
              NBA LITIGMUS is operated for Nigerian legal and court-related use cases. Its privacy governance is therefore
              anchored in the NDPA, the NDPR, and guidance issued by the Nigeria Data Protection Commission (NDPC), while
              also recognizing that stronger or additional foreign privacy laws may apply in specific situations.
            </p>

            <h5 className="mt-4">4. Information We Collect</h5>
            <ul>
              <li>Account and identity data such as name, email, phone number, role, staff ID, and court assignment</li>
              <li>Case and judicial workflow data such as case numbers, filings, schedules, judgments, and service records</li>
              <li>Payment and financial data such as receipt references, status, and payer details</li>
              <li>Technical and usage data such as login timestamps, IP address, device, audit logs, and security events</li>
            </ul>

            <h5 className="mt-4">5. How We Use Your Information</h5>
            <ul>
              <li>To create and manage accounts</li>
              <li>To authenticate users and secure platform access</li>
              <li>To register, manage, and track cases and judicial workflows</li>
              <li>To process payments and maintain financial records</li>
              <li>To maintain audit trails, security controls, and compliance records</li>
            </ul>

            <h5 className="mt-4">6. Your Rights</h5>
            <p>
              Depending on your jurisdiction and the applicable legal framework, you may have rights of access,
              correction, deletion, restriction, objection, portability, withdrawal of consent, and complaint,
              subject to legal retention duties, judicial confidentiality, and other lawful limitations.
            </p>

            <h5 className="mt-4">7. Data Security</h5>
            <ul>
              <li>Encryption in transit and secure storage practices</li>
              <li>Role-based and attribute-based access controls</li>
              <li>PostgreSQL row-level security support for protected backend data paths</li>
              <li>Audit logging, rate limiting, and security monitoring</li>
            </ul>

            <h5 className="mt-4">8. Data Retention</h5>
            <p>
              Personal information is retained only as long as necessary for legal, judicial, regulatory, accounting,
              security, and operational purposes. Case records, finance records, and logs may be retained longer where
              required by law or institutional policy.
            </p>

            <h5 className="mt-4">9. Contact</h5>
            <p>
              Data Protection Contact: <a href="mailto:olaleyelekanjoseph@gmail.com">olaleyelekanjoseph@gmail.com</a>
            </p>

            <hr className="my-4" />
            <p className="text-muted text-center mb-0">
              Effective Date: June 25, 2026
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PrivacyPolicy;