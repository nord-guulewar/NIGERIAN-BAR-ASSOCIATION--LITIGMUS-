const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'frontend', 'public', 'policies');

const files = [
  'PRIVACY_POLICY.md',
  'TERMS_OF_USE.md',
  'DATA_RETENTION_DELETION_POLICY.md',
  'INFORMATION_SECURITY_POLICY.md',
  'INCIDENT_RESPONSE_BREACH_NOTIFICATION_POLICY.md',
  'COOKIE_CLIENT_STORAGE_POLICY.md',
  'ACCESS_CONTROL_AUTHORIZATION_POLICY.md'
];

fs.mkdirSync(outputDir, { recursive: true });

for (const file of files) {
  const source = path.join(repoRoot, file);
  const target = path.join(outputDir, file);
  fs.copyFileSync(source, target);
}

console.log(`Synced ${files.length} policy files to ${outputDir}`);
