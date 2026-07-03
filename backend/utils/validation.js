const Joi = require('joi');

const IDENTIFIER_PATTERN = /^(?:[0-9a-fA-F]{24}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
const CASE_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const CASE_STATUSES = ['Pending', 'In Progress', 'Adjourned', 'Judgement Reserved', 'Closed', 'Dismissed', 'Settled'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Online', 'POS'];
const FEE_TYPES = ['filingFee', 'hearingFee', 'processFee', 'bailiffFee', 'judgmentFee'];

// User Registration Validation Schema
const registerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens and apostrophes',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens and apostrophes'
    }),
  
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'string.min': 'Password must be at least 8 characters long'
    }),
  
  role: Joi.string()
    .valid(
      'admin', 'registrar', 'clerk', 'accountant', 'bailiff', 'secretary',
      'cashier', 'litigation', 'prosecutor', 'probate', 'record_officer',
      'court_reporter', 'usher', 'security', 'librarian'
    )
    .required()
    .messages({
      'any.only': 'Judges must use the dedicated judicial onboarding process'
    }),
  
  phoneNumber: Joi.string()
    .pattern(/^(\+234|0)[789]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid Nigerian phone number'
    }),
  
  state: Joi.string()
    .length(2)
    .uppercase()
    .required(),
  
  lga: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .when('role', {
      is: Joi.not('admin'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  court: Joi.string()
    .min(2)
    .max(4)
    .uppercase()
    .required(),
  
  courtDivision: Joi.string()
    .valid('Main', 'Magisterial District', 'Area Court', 'Customary Court', 'Sharia Court')
    .optional(),
  
  department: Joi.string()
    .valid('Civil', 'Criminal', 'Family', 'Commercial', 'Land', 'Probate', 'Appeal', 'Registry', 'Accounts', 'Records', 'Library', 'Administration')
    .optional(),
  
  staffId: Joi.string()
    .trim()
    .optional(),
  
  dateOfEmployment: Joi.date()
    .optional(),
  
  qualification: Joi.string()
    .valid('SSCE', 'OND', 'HND', 'B.Sc', 'LL.B', 'B.L', 'LL.M', 'Ph.D', 'Other')
    .optional(),
  
  barAdmissionYear: Joi.number()
    .integer()
    .min(1960)
    .max(new Date().getFullYear())
    .when('role', {
      is: Joi.valid('judge', 'litigation', 'prosecutor'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  supremeCourtNumber: Joi.string()
    .trim()
    .pattern(/^SC\/\d+\/\d{4}$/)
    .when('role', {
      is: Joi.valid('judge', 'litigation', 'prosecutor'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.pattern.base': 'Supreme Court Number must be in format SC/NUMBER/YEAR (e.g., SC/123/2020)'
    })
});

// Login Validation Schema
const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),
  
  password: Joi.string()
    .required()
});

// Case Registration Validation Schema
const caseSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Case title must be at least 5 characters'
    }),
  
  caseType: Joi.string()
    .valid('Civil', 'Criminal', 'Family', 'Commercial', 'Land', 'Constitutional', 'Labour', 'Tax', 'Maritime', 'Election', 'Other')
    .required(),
  
  courtType: Joi.string()
    .valid('SC', 'CA', 'FHC', 'SHC', 'SCA', 'CCA', 'MC', 'DC')
    .required(),
  
  state: Joi.string()
    .length(2)
    .uppercase()
    .required(),
  
  plaintiff: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    address: Joi.string().trim().max(200).optional(),
    phoneNumber: Joi.string().pattern(/^(\+234|0)[789]\d{9}$/).optional(),
    email: Joi.string().email().optional(),
    lawyer: Joi.object({
      name: Joi.string().trim().max(100).optional(),
      barNumber: Joi.string().trim().max(50).optional(),
      firmName: Joi.string().trim().max(100).optional(),
      phoneNumber: Joi.string().pattern(/^(\+234|0)[789]\d{9}$/).optional(),
      email: Joi.string().email().optional()
    }).optional()
  }).required(),
  
  defendant: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    address: Joi.string().trim().max(200).optional(),
    phoneNumber: Joi.string().pattern(/^(\+234|0)[789]\d{9}$/).optional(),
    email: Joi.string().email().optional(),
    lawyer: Joi.object({
      name: Joi.string().trim().max(100).optional(),
      barNumber: Joi.string().trim().max(50).optional(),
      firmName: Joi.string().trim().max(100).optional(),
      phoneNumber: Joi.string().pattern(/^(\+234|0)[789]\d{9}$/).optional(),
      email: Joi.string().email().optional()
    }).optional()
  }).required(),
  
  filingFee: Joi.object({
    amount: Joi.number().min(0).max(10000000).required(),
    currency: Joi.string().valid('NGN').default('NGN'),
    paid: Joi.boolean().default(false),
    paymentDate: Joi.date().optional()
  }).optional(),

  priority: Joi.string()
    .valid(...CASE_PRIORITIES)
    .default('Medium'),
  
  notes: Joi.string().max(1000).optional()
});

const caseUpdateSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).optional(),
  caseType: Joi.string()
    .valid('Civil', 'Criminal', 'Family', 'Commercial', 'Land', 'Constitutional', 'Labour', 'Tax', 'Maritime', 'Election', 'Other')
    .optional(),
  courtType: Joi.string()
    .valid('SC', 'CA', 'FHC', 'SHC', 'SCA', 'CCA', 'MC', 'DC')
    .optional(),
  state: Joi.string().length(2).uppercase().optional(),
  plaintiff: caseSchema.extract('plaintiff').optional(),
  defendant: caseSchema.extract('defendant').optional(),
  priority: Joi.string().valid(...CASE_PRIORITIES).optional(),
  notes: Joi.string().max(1000).allow('').optional(),
  status: Joi.string().valid(...CASE_STATUSES).optional(),
  assignedJudge: Joi.string().pattern(IDENTIFIER_PATTERN).allow(null).optional()
});

// Judge Validation Schema
const judgeSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required(),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required(),
  
  title: Joi.string()
    .valid('Justice', 'Judge', 'Magistrate', 'Chief Magistrate')
    .required(),
  
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),
  
  phoneNumber: Joi.string()
    .pattern(/^(\+234|0)[789]\d{9}$/)
    .required(),
  
  courtType: Joi.string()
    .valid('SC', 'CA', 'FHC', 'SHC', 'SCA', 'CCA', 'MC', 'DC')
    .required(),
  
  state: Joi.string()
    .length(2)
    .uppercase()
    .required(),
  
  specialization: Joi.array()
    .items(Joi.string().valid('Civil', 'Criminal', 'Family', 'Commercial', 'Land', 'Constitutional', 'Labour', 'Tax', 'Maritime', 'Election', 'Other'))
    .min(1)
    .required(),
  
  maxDailyCases: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .default(5)
});

// Payment Validation Schema
const paymentSchema = Joi.object({
  paymentType: Joi.string()
    .valid('Filing Fee', 'Hearing Fee', 'Judgment Fee', 'Administrative Fee', 'Court Maintenance', 'Staff Salary', 'Utilities', 'Equipment', 'Other')
    .required(),
  
  amount: Joi.number()
    .min(0)
    .max(100000000)
    .required(),
  
  currency: Joi.string()
    .valid('NGN')
    .default('NGN'),
  
  dueDate: Joi.date()
    .required(),
  
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .optional(),
  
  relatedCase: Joi.string()
    .pattern(IDENTIFIER_PATTERN)
    .optional(),
  
  state: Joi.string()
    .length(2)
    .uppercase()
    .required(),
  
  courtType: Joi.string()
    .valid('SC', 'CA', 'FHC', 'SHC', 'SCA', 'CCA', 'MC', 'DC')
    .required(),
  
  payer: Joi.object({
    name: Joi.string().trim().max(100).required(),
    phoneNumber: Joi.string().pattern(/^(\+234|0)[789]\d{9}$/).optional(),
    email: Joi.string().email().optional()
  }).required(),
  
  description: Joi.string()
    .max(500)
    .optional()
});

const paymentUpdateSchema = Joi.object({
  paymentType: paymentSchema.extract('paymentType').optional(),
  amount: paymentSchema.extract('amount').optional(),
  dueDate: paymentSchema.extract('dueDate').optional(),
  paymentMethod: paymentSchema.extract('paymentMethod').allow(null).optional(),
  relatedCase: paymentSchema.extract('relatedCase').allow(null).optional(),
  state: paymentSchema.extract('state').optional(),
  courtType: paymentSchema.extract('courtType').optional(),
  payer: paymentSchema.extract('payer').optional(),
  description: paymentSchema.extract('description').allow('').optional(),
  status: Joi.string().valid('Pending', 'Paid', 'Overdue', 'Cancelled', 'Refunded').optional()
});

const docketGenerationSchema = Joi.object({
  caseId: Joi.string().pattern(IDENTIFIER_PATTERN).required(),
  sentToId: Joi.string().pattern(IDENTIFIER_PATTERN).required(),
  summary: Joi.string().trim().max(1000).allow('', null).optional(),
  priority: Joi.string().valid(...CASE_PRIORITIES).default('Medium'),
  hearingDate: Joi.date().iso().allow(null, '').optional()
});

const paymentPortalProcessSchema = Joi.object({
  feeTypes: Joi.array()
    .items(Joi.string().valid(...FEE_TYPES))
    .min(1)
    .optional(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS).required(),
  payer: Joi.object({
    name: Joi.string().trim().max(100).required(),
    phoneNumber: Joi.string().pattern(/^(\+234|0)[789]\d{9}$/).optional(),
    email: Joi.string().email().optional()
  }).required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  totalAmount: Joi.any().strip()
});

// Sanitize String - Remove potentially dangerous characters
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

// Sanitize Object - Recursively sanitize all string values
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
};

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
};

// Validate Nigerian Phone Number
const isValidNigerianPhone = (phone) => {
  return /^(\+234|0)[789]\d{9}$/.test(phone);
};

// Validate Email
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Password Strength Checker
const checkPasswordStrength = (password) => {
  const strength = {
    score: 0,
    feedback: []
  };

  if (password.length >= 8) strength.score++;
  if (password.length >= 12) strength.score++;
  if (/[a-z]/.test(password)) strength.score++;
  if (/[A-Z]/.test(password)) strength.score++;
  if (/\d/.test(password)) strength.score++;
  if (/[@$!%*?&]/.test(password)) strength.score++;

  if (strength.score < 4) {
    strength.feedback.push('Password is weak. Add uppercase, lowercase, numbers and special characters.');
  } else if (strength.score < 6) {
    strength.feedback.push('Password is moderate. Consider making it longer.');
  } else {
    strength.feedback.push('Password is strong.');
  }

  return strength;
};

module.exports = {
  registerSchema,
  loginSchema,
  caseSchema,
  caseUpdateSchema,
  judgeSchema,
  paymentSchema,
  paymentUpdateSchema,
  docketGenerationSchema,
  paymentPortalProcessSchema,
  sanitizeString,
  sanitizeObject,
  isValidObjectId,
  isValidNigerianPhone,
  isValidEmail,
  checkPasswordStrength
};
