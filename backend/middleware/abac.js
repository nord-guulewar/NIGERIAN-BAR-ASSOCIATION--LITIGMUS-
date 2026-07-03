const User = require('../models/User');

/**
 * ABAC (Attribute-Based Access Control) Middleware
 * Enforces access based on user attributes + resource attributes
 */

// Define access rules as attribute combinations
const ABAC_RULES = {
  // Judge can access cases in their state + assigned to them
  judge: {
    case: [
      { attributes: ['state', 'assignedJudge'], match: (user, resource) => 
        user.state === resource.state && 
        resource.assignedJudge === user.id 
      }
    ],
    docket: [
      { attributes: ['state', 'sentTo'], match: (user, resource) =>
        user.state === resource.state &&
        resource.sentTo === user.id
      }
    ],
    documents: [
      { attributes: ['state'], match: (user, resource) =>
        user.state === resource.state
      }
    ]
  },

  // Registrar can access cases in their court/state
  registrar: {
    case: [
      { attributes: ['state', 'court'], match: (user, resource) =>
        user.state === resource.state &&
        (!resource.court || resource.court === user.court)
      }
    ],
    user: [
      { attributes: ['state'], match: (user, resource) =>
        user.state === resource.state
      }
    ]
  },

  // Clerk can access cases in their court
  clerk: {
    case: [
      { attributes: ['state', 'court'], match: (user, resource) =>
        user.state === resource.state &&
        user.court === resource.court
      }
    ],
    document: [
      { attributes: ['state', 'court'], match: (user, resource) =>
        user.state === resource.state &&
        user.court === resource.court
      }
    ]
  },

  // Cashier can access payments in their court
  cashier: {
    payment: [
      { attributes: ['state', 'court'], match: (user, resource) =>
        user.state === resource.state &&
        user.court === resource.court
      }
    ]
  },

  // Bailiff can access cases in their state/division
  bailiff: {
    case: [
      { attributes: ['state', 'courtDivision'], match: (user, resource) =>
        user.state === resource.state &&
        (!resource.courtDivision || resource.courtDivision === user.courtDivision)
      }
    ]
  },

  // Accountant - FINANCE DEPARTMENT ONLY - Full payment access
  // NOTE: Judges CANNOT access payments - accountant only
  accountant: {
    payment: [
      { attributes: ['state'], match: (user, resource) =>
        user.state === resource.state // Accountant can see all payments in their state
      }
    ],
    case: [
      { attributes: ['state'], match: (user, resource) =>
        user.state === resource.state // Can view case payment status
      }
    ]
  },

  // Admin has full access
  admin: {
    '*': [
      { attributes: [], match: () => true }
    ]
  }
};

/**
 * Check if user can access resource based on ABAC rules
 * @param {Object} user - User object with attributes
 * @param {String} resourceType - Type of resource (case, document, etc)
 * @param {Object} resource - Resource object to check access for
 * @returns {Boolean} - True if access allowed
 */
const canAccess = (user, resourceType, resource) => {
  if (!user || !resource) return false;

  const rules = ABAC_RULES[user.role];
  if (!rules) return false;

  // Admin can access anything
  if (rules['*']) return true;

  const resourceRules = rules[resourceType];
  if (!resourceRules) return false;

  // Check if any rule matches
  return resourceRules.some(rule => {
    try {
      return rule.match(user, resource);
    } catch (error) {
      console.error(`ABAC match error for ${user.role}/${resourceType}:`, error);
      return false;
    }
  });
};

/**
 * Middleware: Enforce ABAC for resource access
 * Usage: app.use(abacEnforce('case'))
 */
const abacEnforce = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get resource from request
      const resource = req.resource || req.body || {};
      
      // Check ABAC rules
      if (!canAccess(user, resourceType, resource)) {
        return res.status(403).json({
          success: false,
          message: `Access denied to ${resourceType}`,
          details: `Your ${user.role} role cannot access this ${resourceType}`
        });
      }

      next();
    } catch (error) {
      console.error('ABAC enforcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

/**
 * Middleware: Filter query results by ABAC rules
 * Automatically filters find/list results based on user attributes
 */
const abacFilter = (resourceType) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next();

    // Build attribute-based filters
    const filters = {};

    if (user.role === 'judge') {
      filters.state = user.state;
      if (resourceType === 'case') {
        filters.assignedJudge = user.id;
      }
    } else if (user.role === 'registrar' || user.role === 'clerk') {
      filters.state = user.state;
      if (user.court) {
        filters.court = user.court;
      }
    } else if (user.role === 'cashier' || user.role === 'accountant') {
      filters.state = user.state;
      if (resourceType === 'payment' && user.court) {
        filters.court = user.court;
      }
    } else if (user.role === 'bailiff') {
      filters.state = user.state;
    }

    // Attach filters to request for use in routes
    req.abacFilters = filters;
    next();
  };
};

/**
 * Helper: Get filtered query for current user
 * Usage: Case.find(req.abacFilters) // Already filtered by state/court
 */
const getFilteredQuery = (req) => {
  return req.abacFilters || {};
};

/**
 * Helper: Check if user owns resource
 */
const userOwnsResource = (user, resource, ownerField = 'registeredBy') => {
  return resource && resource[ownerField] === user.id;
};

/**
 * Helper: Get accessible states for user
 */
const getAccessibleStates = (user) => {
  if (user.role === 'admin') {
    return null; // All states
  }
  return user.state ? [user.state] : [];
};

/**
 * Helper: Get accessible courts for user
 */
const getAccessibleCourts = (user) => {
  if (user.role === 'admin') {
    return null; // All courts
  }
  if (user.role === 'registrar' || user.role === 'clerk') {
    return user.court ? [user.court] : [];
  }
  return [];
};

module.exports = {
  abacEnforce,
  abacFilter,
  canAccess,
  getFilteredQuery,
  userOwnsResource,
  getAccessibleStates,
  getAccessibleCourts,
  ABAC_RULES
};
