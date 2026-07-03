const fs = require('fs');
const path = require('path');

const INCIDENT_LOG_PATH = process.env.INCIDENT_LOG_PATH || '/tmp/litigmus-incidents.log';

const logIncident = (incident) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity: incident.severity || 'MEDIUM',
    type: incident.type || 'GENERIC',
    message: incident.message,
    userId: incident.userId || null,
    ipAddress: incident.ipAddress || null,
    userAgent: incident.userAgent || null,
    requestId: incident.requestId || null,
    resource: incident.resource || null,
    details: incident.details || {}
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    fs.appendFileSync(INCIDENT_LOG_PATH, logLine, 'utf8');
  } catch (err) {
    console.error('Failed to write incident log:', err.message);
  }

  console.error(`[${logEntry.severity}] ${logEntry.type}: ${logEntry.message}`);
};

const logSecurityEvent = (eventType, details) => {
  logIncident({
    severity: 'HIGH',
    type: 'SECURITY_EVENT',
    message: `Security event: ${eventType}`,
    details: {
      ...details,
      timestamp: new Date().toISOString()
    }
  });
};

const logFailedLogin = (email, ipAddress, userAgent) => {
  logSecurityEvent('FAILED_LOGIN', { email, ipAddress, userAgent });
};

const logSuspiciousActivity = (ipAddress, userAgent, details) => {
  logSecurityEvent('SUSPICIOUS_ACTIVITY', { ipAddress, userAgent, ...details });
};

const logDataBreachAttempt = (resource, ipAddress, userId) => {
  logIncident({
    severity: 'CRITICAL',
    type: 'DATA_BREACH_ATTEMPT',
    message: `Potential data breach attempt on ${resource}`,
    userId,
    ipAddress,
    details: { resource }
  });
};

const getIncidentStats = () => {
  try {
    if (!fs.existsSync(INCIDENT_LOG_PATH)) {
      return { total: 0, bySeverity: {}, byType: {} };
    }
    
    const content = fs.readFileSync(INCIDENT_LOG_PATH, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    
    const stats = {
      total: lines.length,
      bySeverity: {},
      byType: {},
      recent: []
    };
    
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;
        stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      } catch (e) {}
    });
    
    stats.recent = lines.slice(-10).map(line => {
      try { return JSON.parse(line); } catch (e) { return null; }
    }).filter(Boolean);
    
    return stats;
  } catch (err) {
    return { error: err.message };
  }
};

module.exports = {
  logIncident,
  logSecurityEvent,
  logFailedLogin,
  logSuspiciousActivity,
  logDataBreachAttempt,
  getIncidentStats
};