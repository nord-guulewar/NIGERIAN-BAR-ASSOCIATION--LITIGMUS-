import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { policyDocuments } from '../utils/policyDocuments';

const PolicyLinks = ({
  className = '',
  compact = false,
  showOverview = true,
  limit = null,
  policyKeys = null
}) => {
  const location = useLocation();
  const filteredPolicies = Array.isArray(policyKeys) && policyKeys.length > 0
    ? policyDocuments.filter((policy) => policyKeys.includes(policy.key))
    : policyDocuments;
  const visiblePolicies = typeof limit === 'number' ? filteredPolicies.slice(0, limit) : filteredPolicies;

  return (
    <div className={`policy-links-group ${compact ? 'policy-links-compact' : ''} ${className}`.trim()}>
      {showOverview && (
        <Link
          to="/legal-compliance"
          className={`policy-link-item ${location.pathname === '/legal-compliance' ? 'active' : ''}`}
        >
          Legal & Compliance
        </Link>
      )}
        {visiblePolicies.map((policy) => (
        <Link
          key={policy.key}
          to={policy.route}
          className={`policy-link-item ${location.pathname === policy.route ? 'active' : ''}`}
        >
          {policy.title}
        </Link>
      ))}
    </div>
  );
};

export default PolicyLinks;
