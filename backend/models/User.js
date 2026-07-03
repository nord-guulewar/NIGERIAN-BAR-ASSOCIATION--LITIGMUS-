const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(
      'admin',
      'registrar',
      'judge',
      'clerk',
      'accountant',
      'bailiff',
      'secretary',
      'cashier',
      'litigation',
      'prosecutor',
      'probate',
      'record_officer',
      'court_reporter',
      'usher',
      'security',
      'librarian'
    ),
    defaultValue: 'clerk'
  },
  title: {
    type: DataTypes.ENUM('Justice', 'Judge', 'Magistrate', 'Chief Magistrate', 'Chief Judge'),
    defaultValue: 'Judge'
  },
  specialties: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  currentLoad: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  phoneNumber: DataTypes.STRING,
  state: DataTypes.STRING,
  lga: DataTypes.STRING,
  court: DataTypes.STRING,
  courtDivision: {
    type: DataTypes.ENUM('Main', 'Magisterial District', 'Area Court', 'Customary Court', 'Sharia Court'),
    defaultValue: 'Main'
  },
  department: {
    type: DataTypes.ENUM(
      'Civil',
      'Criminal',
      'Family',
      'Commercial',
      'Land',
      'Probate',
      'Appeal',
      'Registry',
      'Accounts',
      'Records',
      'Library',
      'Administration',
      'Judiciary'
    )
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: DataTypes.DATE,
  lastLoginIp: DataTypes.STRING,
  lastUserAgent: DataTypes.STRING,
  staffId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  pendingStaffId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  staffIdRequestStatus: {
    type: DataTypes.STRING,
    defaultValue: 'not_requested'
  },
  staffIdRequestedAt: DataTypes.DATE,
  staffIdApprovedAt: DataTypes.DATE,
  staffIdApprovedBy: DataTypes.UUID,
  offlineRecoveryCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  credentialSelfServiceStartedAt: DataTypes.DATE,
  credentialSelfServiceExpiresAt: DataTypes.DATE,
  staffIdSelfGenerationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  recoveryCodeSelfGenerationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  adminCredentialGenerationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  offlineRecoveryCodeExpires: DataTypes.DATE,
  offlineRecoveryCodeIssuedAt: DataTypes.DATE,
  emailVerificationRisk: {
    type: DataTypes.JSONB,
    defaultValue: {
      score: 0,
      signals: {
        newEmailDomain: false,
        disposableEmail: false,
        mxLookupFailed: false,
        typosquattingRisk: false,
        recentPasswordChange: false,
        deviceChange: false,
        ipGeoMismatch: false
      }
    }
  },
  dateOfEmployment: DataTypes.DATE,
  qualification: {
    type: DataTypes.ENUM('SSCE', 'OND', 'HND', 'B.Sc', 'LL.B', 'B.L', 'LL.M', 'Ph.D', 'Other')
  },
  barAdmissionYear: DataTypes.INTEGER,
  supremeCourtNumber: DataTypes.STRING,
  barRegistrationNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  barVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  barVerificationId: DataTypes.STRING,
  staffIdGenerationCode: DataTypes.STRING,
  staffIdGenerationCodeExpires: DataTypes.DATE,
  verificationCode: DataTypes.STRING,
  verificationCodeExpires: DataTypes.DATE,
  emailConfirmationToken: DataTypes.STRING,
  emailConfirmationTokenExpires: DataTypes.DATE,
  emailConfirmedAt: DataTypes.DATE,
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  accountStatus: {
    type: DataTypes.ENUM('pending', 'active', 'isolated', 'deleted'),
    defaultValue: 'active'
  },
  compromiseReason: DataTypes.TEXT,
  adminConfirmedBy: DataTypes.UUID,
  adminConfirmedAt: DataTypes.DATE,
  manualOnboardedBy: DataTypes.UUID,
  paymentIssueStatus: {
    type: DataTypes.ENUM('none', 'pending', 'investigating', 'resolved'),
    defaultValue: 'none'
  },
  paymentIssueNotes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  preferredVerificationMethod: {
    type: DataTypes.ENUM('sms', 'whatsapp', 'email'),
    defaultValue: 'sms'
  },
  caseNotes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  calendarEvents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  accountLockedUntil: DataTypes.DATE,
  adminFailedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  adminLockedUntil: DataTypes.DATE,
  adminUnlockDocumentsRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  adminUnlockDocumentMeta: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  passwordResetToken: DataTypes.STRING,
  passwordResetExpires: DataTypes.DATE,
  passwordResetRequestedAt: DataTypes.DATE,
  lastPasswordChangeAt: DataTypes.DATE,
  offlineSyncQueue: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  lastSyncedAt: DataTypes.DATE,
  loginActivity: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'users',
  underscored: false,
  hooks: {
    beforeCreate: async (user) => {
      if (!user.password) return;
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    },
    beforeUpdate: async (user) => {
      if (!user.changed('password')) return;
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.recordFailedLogin = async function() {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  
  // Lock account after 5 failed attempts for 15 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  
  await this.save();
  return this.failedLoginAttempts;
};

User.prototype.recordSuccessfulLogin = async function() {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  this.lastLogin = new Date();
  await this.save();
};

User.prototype.isAccountLocked = function() {
  if (!this.accountLockedUntil) return false;
  return this.accountLockedUntil > new Date();
};

User.prototype.recordAdminFailedLogin = async function() {
  this.adminFailedLoginAttempts = (this.adminFailedLoginAttempts || 0) + 1;
  if (this.adminFailedLoginAttempts >= 6) {
    this.adminLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    this.adminUnlockDocumentsRequired = true;
  }
  await this.save();
  return this.adminFailedLoginAttempts;
};

User.prototype.clearAdminLock = async function() {
  this.adminFailedLoginAttempts = 0;
  this.adminLockedUntil = null;
  this.adminUnlockDocumentsRequired = false;
  this.adminUnlockDocumentMeta = {};
  await this.save();
};

User.prototype.isAdminLocked = function() {
  if (!this.adminLockedUntil) return false;
  return this.adminLockedUntil > new Date();
};

User.prototype.generatePasswordResetToken = async function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  this.passwordResetRequestedAt = new Date();
  await this.save();
  return resetToken;
};

User.prototype.clearPasswordResetToken = async function() {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
  await this.save();
};

module.exports = createAdapter(User);
module.exports.Model = User;
