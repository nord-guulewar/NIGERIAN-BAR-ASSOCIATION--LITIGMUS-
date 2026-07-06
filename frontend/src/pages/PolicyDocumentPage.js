import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { Navigate, useParams } from 'react-router-dom';
import PolicyLinks from '../components/PolicyLinks';
import { getPolicyByKey } from '../utils/policyDocuments';

const policyBodies = {
  'terms-of-use': {
    title: 'Terms of Use',
    sections: [
      ['Purpose', 'These terms govern access to and use of NBA LITIGMUS for authorized legal, court, administrative, and institutional purposes.'],
      ['Authorized Use', 'Access is limited to approved users acting within assigned roles and lawful workflows.'],
      ['Prohibited Conduct', 'Users must not misuse accounts, bypass security, access data without authorization, or disclose records improperly.'],
      ['Operational Limits', 'The platform supports court administration but does not replace legal judgment, judicial discretion, or official process.']
    ]
  },
  'data-retention-and-deletion': {
    title: 'Data Retention and Deletion Policy',
    sections: [
      ['Retention Scope', 'This policy covers accounts, case records, payments, logs, documents, backups, and archives.'],
      ['Retention Principle', 'Data is retained only for as long as required for legal, judicial, regulatory, security, and operational reasons.'],
      ['Deletion and Anonymization', 'Data that is no longer required should be deleted, anonymized, or archived under controlled access, unless preservation duties apply.'],
      ['Legal Holds', 'Deletion is suspended where a record is subject to litigation hold, investigation, court order, or regulatory preservation duty.']
    ]
  },
  'information-security': {
    title: 'Information Security Policy',
    sections: [
      ['Security Objectives', 'The platform must protect confidentiality, integrity, availability, and accountability of legal, personal, financial, and operational records.'],
      ['Control Baseline', 'Controls include authentication, access control, encryption, logging, monitoring, validation, backup, and secure change management.'],
      ['Third-Party Risk', 'Providers that store or process platform data must operate under appropriate security and confidentiality obligations.'],
      ['Governance', 'Security controls should be reviewed regularly and aligned with privacy, incident response, and access-control policies.']
    ]
  },
  'incident-response-and-breach-notification': {
    title: 'Incident Response and Data Breach Notification Policy',
    sections: [
      ['Response Stages', 'Incidents are handled through identification, containment, investigation, remediation, recovery, and post-incident review.'],
      ['Notification', 'Where required by law, affected institutions, regulators, or individuals must be notified within the applicable legal timelines.'],
      ['Escalation', 'Material incidents must be escalated to appropriate security, legal, privacy, and administrative stakeholders.'],
      ['Recordkeeping', 'Incidents and response actions should be documented for audit, compliance, and learning purposes.']
    ]
  },
  'cookie-and-client-storage': {
    title: 'Cookie and Client Storage Policy',
    sections: [
      ['Purpose', 'This policy explains the use of cookies, tokens, browser storage, and similar client-side technologies.'],
      ['Permitted Uses', 'Client-side storage is used for authentication, security, workflow continuity, and operational reliability.'],
      ['Security Controls', 'Where used, cookies or tokens should be protected through secure transport, restricted scope, and appropriate lifetime controls.'],
      ['User Choice', 'Disabling essential client-side storage may affect authentication or core platform functionality.']
    ]
  },
  'access-control-and-authorization': {
    title: 'Access Control and Authorization Policy',
    sections: [
      ['Principles', 'Access follows least privilege, need-to-know access, role-based restrictions, attribute-based limits where applicable, and timely revocation.'],
      ['Access Lifecycle', 'Provisioning, review, modification, and revocation must follow approved administrative processes.'],
      ['Privileged Access', 'Elevated access must be restricted, monitored, and logged.'],
      ['Enforcement', 'Unauthorized access attempts or privilege misuse may result in suspension, investigation, or further action.']
    ]
  }
};

const PolicyDocumentPage = () => {
  const { policyKey } = useParams();
  const policy = getPolicyByKey(policyKey);

  if (!policy || !policyBodies[policyKey]) {
    return <Navigate to="/legal-compliance" replace />;
  }

  const body = policyBodies[policyKey];

  return (
    <Container className="py-4 py-md-5 policy-page policy-document-page">
      <Card className="border-0 shadow-sm policy-page-shell">
        <Card.Body className="p-4 p-md-5">
          <h1 className="mb-2">{body.title}</h1>
          <p className="text-muted mb-4">{policy.summary}</p>
          <PolicyLinks className="mb-4" />
          <div className="policy-page-content policy-markdown-content" style={{ lineHeight: '1.8' }}>
            {body.sections.map(([heading, text]) => (
              <section key={heading} className="mb-4">
                <h5>{heading}</h5>
                <p className="mb-0">{text}</p>
              </section>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PolicyDocumentPage;