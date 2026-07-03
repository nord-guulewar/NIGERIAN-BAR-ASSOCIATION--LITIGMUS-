export const policyDocuments = [
  {
    key: 'privacy-policy',
    title: 'Privacy Policy',
    fileName: 'PRIVACY_POLICY.md',
    route: '/privacy',
    summary: 'Explains how personal information is collected, used, shared, retained, and protected under Nigerian and applicable international privacy frameworks.'
  },
  {
    key: 'terms-of-use',
    title: 'Terms of Use',
    fileName: 'TERMS_OF_USE.md',
    route: '/policies/terms-of-use',
    summary: 'Defines permitted use of the platform, user obligations, account controls, and operational limitations for authorized users.'
  },
  {
    key: 'data-retention-and-deletion',
    title: 'Data Retention and Deletion Policy',
    fileName: 'DATA_RETENTION_DELETION_POLICY.md',
    route: '/policies/data-retention-and-deletion',
    summary: 'Explains how user records, case files, payments, logs, and archives are retained, preserved, deleted, or anonymized.'
  },
  {
    key: 'information-security',
    title: 'Information Security Policy',
    fileName: 'INFORMATION_SECURITY_POLICY.md',
    route: '/policies/information-security',
    summary: 'Describes the platform security baseline, including authentication, encryption, monitoring, logging, backups, and secure administration.'
  },
  {
    key: 'incident-response-and-breach-notification',
    title: 'Incident Response and Data Breach Notification Policy',
    fileName: 'INCIDENT_RESPONSE_BREACH_NOTIFICATION_POLICY.md',
    route: '/policies/incident-response-and-breach-notification',
    summary: 'Explains how security incidents are identified, contained, investigated, remediated, and escalated.'
  },
  {
    key: 'cookie-and-client-storage',
    title: 'Cookie and Client Storage Policy',
    fileName: 'COOKIE_CLIENT_STORAGE_POLICY.md',
    route: '/policies/cookie-and-client-storage',
    summary: 'Describes how cookies, tokens, and client-side storage are used for authentication, security, and continuity of service.'
  },
  {
    key: 'access-control-and-authorization',
    title: 'Access Control and Authorization Policy',
    fileName: 'ACCESS_CONTROL_AUTHORIZATION_POLICY.md',
    route: '/policies/access-control-and-authorization',
    summary: 'Explains least-privilege access, role-based restrictions, access reviews, and revocation controls across court functions.'
  }
];

export const getPolicyByKey = (policyKey) => policyDocuments.find((policy) => policy.key === policyKey) || null;
