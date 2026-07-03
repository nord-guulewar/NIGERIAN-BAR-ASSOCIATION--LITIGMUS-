export const policyDocuments = {
  'privacy-policy': {
    title: 'Privacy Policy',
    effectiveDate: 'June 25, 2026',
    summary: 'How NBA LITIGMUS collects, uses, shares, retains, and protects personal information for Nigerian and international users where applicable.',
    sections: [
      {
        heading: 'Introduction',
        paragraphs: [
          'NBA LITIGMUS supports Nigerian legal, court, and administrative workflows. This policy explains how personal information is processed in line with the Nigeria Data Protection Act 2023, the Nigeria Data Protection Regulation, and, where applicable, international privacy frameworks such as the GDPR and CCPA/CPRA.',
          'The policy applies regardless of nationality, descent, place of birth, citizenship, or naturalization status where personal information is processed through the platform.'
        ]
      },
      {
        heading: 'Key Privacy Topics',
        bullets: [
          'Collection of account, case, payment, technical, and security-related information',
          'Use of data for court operations, compliance, security, reporting, and workflow management',
          'Role-based and need-to-know sharing for authorized court and institutional functions',
          'Retention subject to legal, judicial, financial, audit, and security obligations',
          'Rights of access, correction, deletion, restriction, objection, portability, and complaint where applicable'
        ]
      }
    ]
  },
  'terms-of-use': {
    title: 'Terms of Use',
    effectiveDate: 'June 25, 2026',
    summary: 'Rules governing permitted access, user responsibilities, platform restrictions, and operational use of NBA LITIGMUS.',
    sections: [
      {
        heading: 'Authorized Use',
        bullets: [
          'Access is limited to authorized users with a legitimate institutional or legal purpose',
          'Users must provide accurate information and protect credentials',
          'Court, legal, and operational data must only be accessed for approved duties'
        ]
      },
      {
        heading: 'Prohibited Conduct',
        bullets: [
          'Unauthorized access, credential sharing, or misuse of case data',
          'Attempts to interfere with system security or availability',
          'Use of the platform for unrelated or unauthorized commercial purposes'
        ]
      }
    ]
  },
  'data-retention-deletion': {
    title: 'Data Retention and Deletion Policy',
    effectiveDate: 'June 25, 2026',
    summary: 'Retention, archival, deletion, anonymization, and preservation rules for accounts, case records, financial data, logs, and backups.',
    sections: [
      {
        heading: 'Retention Principles',
        bullets: [
          'Data is retained only as long as necessary for legal, judicial, regulatory, accounting, security, and operational purposes',
          'Case records follow court rules, preservation duties, and institutional schedules',
          'Audit logs and security records are retained for accountability and incident review',
          'Deletion may be delayed by legal hold, investigations, or preservation requirements'
        ]
      }
    ]
  },
  'information-security': {
    title: 'Information Security Policy',
    effectiveDate: 'June 25, 2026',
    summary: 'Baseline security requirements for confidentiality, integrity, availability, monitoring, secure administration, and third-party risk management.',
    sections: [
      {
        heading: 'Security Controls',
        bullets: [
          'Strong authentication and access control',
          'Encryption and secure storage practices',
          'Logging, monitoring, abuse prevention, and secure change management',
          'Backup, recovery, and incident readiness measures'
        ]
      }
    ]
  },
  'incident-response-breach-notification': {
    title: 'Incident Response and Data Breach Notification Policy',
    effectiveDate: 'June 25, 2026',
    summary: 'How incidents are identified, contained, investigated, remediated, escalated, documented, and reported.',
    sections: [
      {
        heading: 'Response Lifecycle',
        bullets: [
          'Identification and evidence preservation',
          'Containment of affected systems, accounts, and integrations',
          'Investigation of scope, cause, impact, and affected data',
          'Remediation, recovery, and post-incident review',
          'Notification where required by law or institutional obligation'
        ]
      }
    ]
  },
  'cookie-client-storage': {
    title: 'Cookie and Client Storage Policy',
    effectiveDate: 'June 25, 2026',
    summary: 'How cookies, tokens, and client-side storage are used for authentication, security, and continuity of service.',
    sections: [
      {
        heading: 'Use of Client Storage',
        bullets: [
          'Authentication and session continuity',
          'Security verification and abuse prevention',
          'User preferences and workflow continuity',
          'No third-party behavioral advertising use'
        ]
      }
    ]
  },
  'access-control-authorization': {
    title: 'Access Control and Authorization Policy',
    effectiveDate: 'June 25, 2026',
    summary: 'Least-privilege access rules, role assignment, access review, privileged account handling, and revocation requirements.',
    sections: [
      {
        heading: 'Access Principles',
        bullets: [
          'Least privilege and need-to-know access',
          'Role-based and attribute-based restrictions',
          'Periodic review of user and privileged access',
          'Prompt modification or revocation when access is no longer justified'
        ]
      }
    ]
  }
};

export const policyNavigation = [
  { id: 'privacy-policy', label: 'Privacy' },
  { id: 'terms-of-use', label: 'Terms' },
  { id: 'data-retention-deletion', label: 'Retention' },
  { id: 'information-security', label: 'Security' },
  { id: 'incident-response-breach-notification', label: 'Incident Response' },
  { id: 'cookie-client-storage', label: 'Cookies' },
  { id: 'access-control-authorization', label: 'Access Control' }
];