const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sanitizeObject } = require('../utils/validation');
const { sendAccountConfirmationEmail } = require('../utils/notificationService');
const { sendVerificationCode, verifyCode } = require('../utils/verificationService');
const { verifyBarRegistration, checkBarRegistrationExists, generateStaffIdCode, sendStaffIdCodeEmail, STAFF_ID_CODE_EXPIRY_MINUTES } = require('../utils/barRegistration');
const { generateStaffId, validateStaffIdFormat } = require('../utils/staffIdGenerator');
const {
  requestStaffIdGeneration,
  verifyStaffIdCodeAndGenerate
} = require('../utils/staffIdService');
const {
  canSelfGenerateRecoveryCode,
  registerSelfRecoveryCodeGeneration,
  canSelfGenerateStaffId,
  registerSelfStaffIdGeneration,
  getCredentialControls
} = require('../utils/credentialPolicy');
const {
  loginRateLimiter,
  registrationRateLimiter,
  verificationRateLimiter,
  passwordResetRateLimiter,
  recoveryLoginRateLimiter,
  apiRateLimiter
} = require('../middleware/security');
const { logFailedLogin, logSecurityEvent } = require('../utils/incidentLogger');
const { getFirebaseAdmin, isFirebaseAdminConfigured } = require('../config/firebaseAdmin');

const barVerificationStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [token, data] of barVerificationStore.entries()) {
    if (now > data.expiresAt) {
      barVerificationStore.delete(token);
    }
  }
}, 60000);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateEmailConfirmationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const getUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  title: user.title,
  email: user.email,
  role: user.role,
  state: user.state,
  lga: user.lga,
  court: user.court,
  courtDivision: user.courtDivision,
  department: user.department
});

const getAuthUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  title: user.title,
  email: user.email,
  role: user.role,
  accountType: user.role === 'admin' ? 'Administrator' : user.role === 'judge' ? 'Judicial officer' : 'Court staff',
  accountStatus: user.accountStatus,
  createdAt: user.createdAt,
  isActive: user.isActive,
  isVerified: user.isVerified,
  state: user.state,
  lga: user.lga,
  court: user.court,
  courtDivision: user.courtDivision,
  department: user.department,
  phoneNumber: user.phoneNumber,
  staffId: user.staffId,
  pendingStaffId: user.pendingStaffId,
  staffIdRequestStatus: user.staffIdRequestStatus
});

const findUserByPrimaryKey = async (id) => {
  if (!id) return null;
  if (typeof User.findByPk === 'function') {
    return User.findByPk(id);
  }
  return User.findById(id);
};

const getUserIdentifier = (user) => user.id || user._id;

const recordLoginActivity = async (user, req, channel = 'standard_login') => {
  const entries = Array.isArray(user.loginActivity) ? user.loginActivity : [];
  entries.unshift({
    at: new Date(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
    state: user.state,
    lga: user.lga,
    channel
  });
  user.loginActivity = entries.slice(0, 20);
  user.lastLoginIp = req.ip;
  user.lastUserAgent = req.get('user-agent') || '';
  user.lastLogin = new Date();
  await user.save();
};

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `**@${domain}`;
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 6))}${name[name.length - 1]}@${domain}`;
};

router.post('/register', registrationRateLimiter, async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      state,
      lga,
      court,
      courtDivision,
      department
    } = sanitizedData;

    if (role === 'judge') {
      return res.status(403).json({
        success: false,
        message: 'Judge accounts must be created through the dedicated judicial onboarding process.'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const courtCode = court || 'NA';
    const deptCode = department ? department.substring(0, 2).toUpperCase() : 'XX';
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    const recoveryCode = `NBA-${courtCode}-${deptCode}-${year}${month}-${suffix}`;

    const emailConfirmationToken = generateEmailConfirmationToken();
    const emailConfirmationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const recoveryExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      state,
      lga,
      court,
      courtDivision,
      department,
      offlineRecoveryCode: recoveryCode,
      offlineRecoveryCodeExpires: recoveryExpires,
      offlineRecoveryCodeIssuedAt: new Date(),
      isVerified: false,
      emailConfirmationToken,
      emailConfirmationTokenExpires
    });

    const emailResult = await sendAccountConfirmationEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      emailConfirmationToken
    );

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      message: emailResult.success 
        ? 'Registration successful. Please check your email to confirm your account.'
        : 'Registration successful. Email confirmation could not be sent - please contact support.',
      data: {
        user: getUserResponse(user),
        emailConfirmationSent: emailResult.success,
        offsiteAccess: {
          recoveryCode,
          expiresAt: recoveryExpires,
          instructions: 'Use your email or recovery code to access your account offline or if you forget your password.'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/request-staff-id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const result = await requestStaffIdGeneration(user);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/verify-staff-id', protect, async (req, res) => {
  try {
    const { code, state, lga } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const stateValue = state || user.state;
    const lgaValue = lga || user.lga;

    const result = await verifyStaffIdCodeAndGenerate(
      req.user._id,
      code,
      user.role,
      stateValue,
      lgaValue,
      user.title
    );

    const statusCode = result.success ? 200 : 400;

    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/verify-bar-registration', async (req, res) => {
  try {
    const { barRegistrationNumber, email, firstName, lastName, phoneNumber, title, state, lga } = req.body;

    if (!barRegistrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bar registration number is required.'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required. The Staff ID generation code will be sent to this email.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const barResult = await verifyBarRegistration(barRegistrationNumber, {
      firstName,
      lastName,
      phoneNumber
    });

    if (!barResult.success) {
      return res.status(400).json(barResult);
    }

    const cleaned = barResult.data.barRegistrationNumber || barRegistrationNumber.trim().toUpperCase();

    const code = generateStaffIdCode();
    const expiresAt = new Date(Date.now() + STAFF_ID_CODE_EXPIRY_MINUTES * 60 * 1000);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    barVerificationStore.set(verificationToken, {
      barRegistrationNumber: cleaned,
      email,
      firstName,
      lastName,
      title,
      state,
      lga,
      code,
      expiresAt: expiresAt.getTime(),
      barVerificationId: barResult.data.verificationId
    });

    const emailResult = await sendStaffIdCodeEmail(email, firstName || 'Judicial Officer', code);

    if (!emailResult.success) {
      console.error('Staff ID code email failed:', emailResult.message);
      barVerificationStore.delete(verificationToken);
      return res.status(500).json({
        success: false,
        message: 'Failed to send Staff ID generation code. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: `Bar registration verified. A Staff ID generation code has been sent to ${email}.`,
      data: {
        verificationToken,
        email: maskEmail(email),
        expiresAt,
        demoCode: emailResult.code
      }
    });
  } catch (error) {
    console.error('Bar verification error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Bar verification failed. Please try again.'
    });
  }
});

router.post('/generate-staff-id', async (req, res) => {
  try {
    const { verificationToken, code, title, state, lga } = req.body;

    if (!verificationToken || !code) {
      return res.status(400).json({
        success: false,
        message: 'Verification token and code are required.'
      });
    }

    const stored = barVerificationStore.get(verificationToken);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification session. Please verify your bar registration again.'
      });
    }

    if (Date.now() > stored.expiresAt) {
      barVerificationStore.delete(verificationToken);
      return res.status(400).json({
        success: false,
        message: 'Staff ID generation code has expired. Please verify your bar registration again.'
      });
    }

    if (stored.code !== code.toUpperCase().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code. Please enter the code sent to your email.'
      });
    }

    const finalTitle = title || stored.title;
    const finalState = state || stored.state;
    const finalLga = lga || stored.lga;

    if (!finalTitle) {
      return res.status(400).json({
        success: false,
        message: 'Judicial title is required to generate Staff ID.'
      });
    }

    if (!finalState) {
      return res.status(400).json({
        success: false,
        message: 'State is required to generate Staff ID.'
      });
    }

    const staffId = await generateStaffId('judge', finalState, finalLga, finalTitle);
    
    // Update the user's staffId in the database
    const user = await User.findOne({ email: stored.email }).select('+password');
    if (user) {
      const policyCheck = canSelfGenerateStaffId(user, new Date());
      if (!policyCheck.allowed) {
        await user.save();
        return res.status(400).json({
          success: false,
          message: policyCheck.message,
          controls: policyCheck.controls
        });
      }

      user.pendingStaffId = staffId;
      user.staffIdRequestStatus = 'pending_approval';
      user.staffIdRequestedAt = new Date();
      registerSelfStaffIdGeneration(user);
      await user.save();
    }

    barVerificationStore.delete(verificationToken);

    res.status(200).json({
      success: true,
      message: 'Staff ID generated and submitted for admin approval.',
      data: {
        staffId,
        approvalRequired: true,
        barRegistrationNumber: stored.barRegistrationNumber,
        title: finalTitle,
        state: finalState,
        lga: finalLga
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/register-judge', registrationRateLimiter, async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const {
      title,
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      state,
      lga,
      court,
      courtDivision,
      department,
      barAdmissionYear,
      supremeCourtNumber,
      barRegistrationNumber,
      dateOfEmployment
    } = sanitizedData;

    if (department !== 'Administration' && department !== 'Appeal' && department !== 'Civil' && department !== 'Commercial' && department !== 'Criminal' && department !== 'Family' && department !== 'Judiciary' && department !== 'Land' && department !== 'Probate' && department !== 'Registry') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department selection'
      });
    }

    if (!title || !['Justice', 'Judge', 'Chief Magistrate', 'Magistrate'].includes(title)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid judicial title'
      });
    }

    const validCourts = ['SC', 'CA', 'FHC', 'SHC', 'SCA', 'CCA', 'MC', 'DC'];
    if (!court || !validCourts.includes(court)) {
      return res.status(400).json({
        success: false,
        message: `Invalid court. Must be one of: ${validCourts.join(', ')}`
      });
    }

    if (!barRegistrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bar registration number is required for judicial registration.'
      });
    }

    if (!/^SC\/\d+\/\d{4}$/.test(barRegistrationNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Bar registration number must be in format SC/NUMBER/YEAR (e.g., SC/1234/2015).'
      });
    }

    if (!barAdmissionYear || !supremeCourtNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bar admission year and Supreme Court Number are required for judicial registration'
      });
    }

    if (!/^SC\/\d+\/\d{4}$/.test(supremeCourtNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Supreme Court Number must be in format SC/NUMBER/YEAR'
      });
    }

    const barCheckResult = await checkBarRegistrationExists(barRegistrationNumber, User);
    if (barCheckResult.exists) {
      return res.status(409).json({
        success: false,
        message: 'This bar registration number is already registered in the system.'
      });
    }

    const barVerifyResult = await verifyBarRegistration(barRegistrationNumber, {
      firstName,
      lastName,
      phoneNumber
    });
    if (!barVerifyResult.success) {
      return res.status(400).json({
        success: false,
        message: barVerifyResult.message || 'Bar registration verification failed.'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A judge with this email already exists'
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const courtCode = court || 'NA';
    const deptCode = department ? department.substring(0, 2).toUpperCase() : 'XX';
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    const recoveryCode = `NBA-${courtCode}-${deptCode}-${year}${month}-${suffix}`;

    const emailConfirmationToken = generateEmailConfirmationToken();
    const emailConfirmationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const recoveryExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      title,
      firstName,
      lastName,
      email,
      password,
      role: 'judge',
      phoneNumber,
      state,
      lga,
      court,
      courtDivision,
      department,
      barAdmissionYear,
      supremeCourtNumber,
      barRegistrationNumber,
      barVerified: true,
      barVerificationId: barVerifyResult.data?.verificationId || barVerifyResult.verificationId,
      dateOfEmployment,
      offlineRecoveryCode: recoveryCode,
      offlineRecoveryCodeExpires: recoveryExpires,
      offlineRecoveryCodeIssuedAt: new Date(),
      isVerified: false,
      emailConfirmationToken,
      emailConfirmationTokenExpires
    });

    console.log('User created:', user._id);

    const emailResult = await sendAccountConfirmationEmail(
      user.email,
      `${user.title || 'Justice'} ${user.firstName} ${user.lastName}`,
      emailConfirmationToken
    );

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      message: emailResult.success 
        ? 'Judge registration successful. Please check your email to confirm your judicial account.'
        : 'Judge registration successful. Email confirmation could not be sent - please contact support.',
      data: {
        user: getUserResponse(user),
        emailConfirmationSent: emailResult.success,
        offsiteAccess: {
          recoveryCode,
          expiresAt: recoveryExpires,
          instructions: 'After email confirmation, request a Staff ID generation code from your profile.'
        }
      }
    });
  } catch (error) {
    console.error('Judge registration error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Judge registration failed. Please try again.'
    });
  }
});

router.post('/judge/login-step1', async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const { email, staffId, password } = sanitizedData;

    if ((!email && !staffId) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or Staff ID, along with password'
      });
    }

    let user;
    if (staffId) {
      user = await User.findOne({ staffId, role: 'judge' }).select('+password');
    } else {
      user = await User.findOne({ email, role: 'judge' }).select('+password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid judge credentials'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid judge credentials'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your judicial email before logging in'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Judge account is deactivated. Please contact administrator'
      });
    }

    const result = await sendVerificationCode(user._id, req.ip, req.get('user-agent'));

    res.status(200).json({
      success: true,
      message: 'Judge verification code sent via email',
      data: {
        userId: user._id,
        email: maskEmail(user.email),
        staffId: user.staffId,
        method: 'email',
        expiresAt: result.expiresAt,
        risk: result.risk
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/judge/login-verify', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide judge ID and verification code'
      });
    }

    const user = await User.findOne({ _id: userId, role: 'judge' });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid judge session'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your judicial email before logging in'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Judge account is deactivated. Please contact administrator'
      });
    }

    const verifyResult = await verifyCode(userId, code);

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message
      });
    }

    await recordLoginActivity(user, req, 'judge_login');

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Judge login successful',
      data: {
        user: getAuthUserResponse(user),
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/judge/resend-code', recoveryLoginRateLimiter, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide judge ID'
      });
    }

    const user = await User.findOne({ _id: userId, role: 'judge' });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid judge session'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your judicial email before logging in'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Judge account is deactivated. Please contact administrator'
      });
    }

    const result = await sendVerificationCode(userId, req.ip, req.get('user-agent'));

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
      ...(result.success ? { expiresAt: result.expiresAt } : {})
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const { email, password } = sanitizedData;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.role === 'judge') {
      return res.status(400).json({
        success: false,
        message: 'Judicial officers must use the judge login portal.'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators must use the dedicated admin login portal.'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      logFailedLogin(email, req.ip, req.get('user-agent'));
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your email before logging in'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator'
      });
    }

    await recordLoginActivity(user, req, 'user_login');

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          state: user.state,
          court: user.court,
          staffId: user.staffId,
          pendingStaffId: user.pendingStaffId,
          staffIdRequestStatus: user.staffIdRequestStatus
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/firebase/login', loginRateLimiter, async (req, res) => {
  try {
    if (!isFirebaseAdminConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Firebase authentication is not configured on the server.'
      });
    }

    const { idToken } = sanitizeObject(req.body || {});
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    const firebaseAdmin = getFirebaseAdmin();
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken, true);
    const email = decodedToken.email ? String(decodedToken.email).toLowerCase() : '';

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Firebase account does not expose an email address.'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No application user is linked to this Firebase account.'
      });
    }

    if (user.role === 'judge') {
      return res.status(400).json({
        success: false,
        message: 'Judicial officers must use the judge login portal.'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators must use the dedicated admin login portal.'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your email before logging in'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator'
      });
    }

    await recordLoginActivity(user, req, 'firebase_login');

    const token = generateToken(getUserIdentifier(user));

    return res.status(200).json({
      success: true,
      message: 'Firebase login successful',
      data: {
        user: getAuthUserResponse(user),
        token
      }
    });
  } catch (error) {
    logSecurityEvent('FIREBASE_LOGIN_FAILED', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      error: error.message
    });

    return res.status(401).json({
      success: false,
      message: 'Firebase authentication failed'
    });
  }
});

router.post('/confirm-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation token is required'
      });
    }

    const user = await User.findOne({ emailConfirmationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation link'
      });
    }

    if (!user.emailConfirmationTokenExpires || new Date() > new Date(user.emailConfirmationTokenExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation link has expired. Please request a new confirmation email.'
      });
    }

    user.isVerified = true;
    user.emailConfirmedAt = new Date();
    user.emailConfirmationToken = null;
    user.emailConfirmationTokenExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email confirmed successfully. Welcome to NBA LITIGMUS.',
      data: {
        user: getUserResponse(user)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/resend-confirmation', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified. You can login.'
      });
    }

    const emailConfirmationToken = generateEmailConfirmationToken();
    const emailConfirmationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailConfirmationToken = emailConfirmationToken;
    user.emailConfirmationTokenExpires = emailConfirmationTokenExpires;
    await user.save();

    const emailResult = await sendAccountConfirmationEmail(
      user.email,
      `${user.title || ''} ${user.firstName} ${user.lastName}`.trim(),
      emailConfirmationToken
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send confirmation email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Confirmation email has been resent. Please check your inbox.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const controls = getCredentialControls(user, new Date());

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          accountType: user.role === 'admin' ? 'Administrator' : user.role === 'judge' ? 'Judicial officer' : 'Court staff',
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
          isActive: user.isActive,
          isVerified: user.isVerified,
          state: user.state,
          lga: user.lga,
          court: user.court,
          department: user.department,
          phoneNumber: user.phoneNumber,
          lastLogin: user.lastLogin,
          staffId: user.staffId,
          pendingStaffId: user.pendingStaffId,
          staffIdRequestStatus: user.staffIdRequestStatus,
          credentialControls: controls
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/update-profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phoneNumber },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    user.accountStatus = 'deleted';
    user.offlineRecoveryCode = null;
    user.offlineRecoveryCodeExpires = null;
    user.offlineRecoveryCodeIssuedAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/recovery-code', recoveryLoginRateLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const policyCheck = canSelfGenerateRecoveryCode(user, new Date());
    if (!policyCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: policyCheck.message,
        controls: policyCheck.controls
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Recovery code access is managed by administrators only.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/recovery-login', recoveryLoginRateLimiter, async (req, res) => {
  try {
    if (!policyCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: policyCheck.message,
        controls: policyCheck.controls
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Recovery code access is managed by administrators only.'
    });

    if (!user.offlineRecoveryCodeExpires || new Date() > user.offlineRecoveryCodeExpires) {
      return res.status(401).json({
        success: false,
        message: 'Recovery code has expired. Please request a new one.'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please confirm your email before using recovery login'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator'
      });
    }

    await recordLoginActivity(user, req, 'recovery_login');

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Recovery login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          state: user.state,
          court: user.court,
          staffId: user.staffId,
          pendingStaffId: user.pendingStaffId,
          staffIdRequestStatus: user.staffIdRequestStatus
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/risk-evaluate', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+emailVerificationRisk');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const requestIp = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('user-agent') || '';
    const emailDomain = (user.email || '').split('@')[1]?.toLowerCase() || '';
    const wellKnownDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'nbalitigmus.ng', 'court.gov.ng'];
    const disposableDomains = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'yopmail.com'];
    const isNewDomain = !wellKnownDomains.includes(emailDomain);
    const isDisposable = disposableDomains.includes(emailDomain);
    const mxLookupFailed = isDisposable || /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(emailDomain);
    const typosquattingRisk = /(googole|yahooo|outlok|hotmal|nbal[o0]tgmus|c[o0]urt|gouv)/i.test(emailDomain);
    const recentPasswordChange = user.updatedAt ? (Date.now() - user.updatedAt.getTime()) < 1000 * 60 * 60 * 24 : true;
    const deviceChange = !user.emailVerificationRisk?.signals?.deviceChange || user.emailVerificationRisk.signals.deviceChange;

    let score = 0;
    const signals = {
      newEmailDomain: isNewDomain,
      disposableEmail: isDisposable,
      mxLookupFailed: mxLookupFailed,
      typosquattingRisk,
      recentPasswordChange,
      deviceChange,
      ipGeoMismatch: !/^::1$|^127\./.test(requestIp) && !requestIp.startsWith('192.168.')
    };

    if (signals.disposableEmail) score += 35;
    if (signals.typosquattingRisk) score += 25;
    if (signals.mxLookupFailed) score += 15;
    if (signals.newEmailDomain) score += 10;
    if (signals.recentPasswordChange) score += 10;
    if (signals.deviceChange) score += 10;
    if (signals.ipGeoMismatch) score += 5;

    if (score > 100) score = 100;

    user.emailVerificationRisk = {
      score,
      signals,
      evaluatedAt: new Date()
    };
    await user.save();

    res.status(200).json({
      success: true,
      data: user.emailVerificationRisk
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/admin/login', loginRateLimiter, async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const { email, password } = sanitizedData;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    if (user.isAdminLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Admin account is temporarily locked after too many failed attempts.',
        data: {
          lockedUntil: user.adminLockedUntil,
          documentsRequired: Boolean(user.adminUnlockDocumentsRequired)
        }
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      await user.recordAdminFailedLogin();
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
        data: { attemptsUsed: user.adminFailedLoginAttempts }
      });
    }

    if (!user.isVerified || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is not active. Please contact super administrator.'
      });
    }

    await user.clearAdminLock();
    await recordLoginActivity(user, req, 'admin_login');
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          state: user.state,
          lga: user.lga,
          court: user.court,
          department: user.department
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/admin/unlock-request', async (req, res) => {
  try {
    const { email, documentType, documentReference, explanation } = req.body;

    if (!email || !documentType || !documentReference || !explanation) {
      return res.status(400).json({
        success: false,
        message: 'email, documentType, documentReference and explanation are required'
      });
    }

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    user.adminUnlockDocumentMeta = {
      documentType,
      documentReference,
      explanation,
      submittedAt: new Date()
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Unlock documents submitted. Awaiting approval by another administrator.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/logout', protect, async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
