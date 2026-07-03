const SELF_GENERATION_LIMIT = 2;
const SELF_WINDOW_HOURS = 24;
const ADMIN_GENERATION_LIMIT = 5;

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const ensureSelfWindow = (user, now = new Date()) => {
  if (!user.credentialSelfServiceStartedAt) {
    user.credentialSelfServiceStartedAt = now;
    user.credentialSelfServiceExpiresAt = addHours(now, SELF_WINDOW_HOURS);
  }
};

const getCredentialControls = (user, now = new Date()) => {
  const startedAt = user.credentialSelfServiceStartedAt || null;
  const expiresAt = user.credentialSelfServiceExpiresAt || null;
  const windowExpired = Boolean(expiresAt && now > expiresAt);

  const staffIdSelfCount = Number(user.staffIdSelfGenerationCount || 0);
  const recoverySelfCount = Number(user.recoveryCodeSelfGenerationCount || 0);
  const adminGenerationCount = Number(user.adminCredentialGenerationCount || 0);

  return {
    policy: {
      selfGenerationLimit: SELF_GENERATION_LIMIT,
      selfWindowHours: SELF_WINDOW_HOURS,
      adminGenerationLimit: ADMIN_GENERATION_LIMIT
    },
    writeDownReminder: 'Write down your Staff ID and recovery code in a safe place. These options are limited.',
    selfService: {
      startedAt,
      expiresAt,
      windowExpired,
      staffId: {
        used: staffIdSelfCount,
        remaining: Math.max(SELF_GENERATION_LIMIT - staffIdSelfCount, 0),
        canGenerate: !windowExpired && staffIdSelfCount < SELF_GENERATION_LIMIT
      },
      recoveryCode: {
        used: recoverySelfCount,
        remaining: 0,
        canGenerate: false,
        adminOnly: true
      }
    },
    adminService: {
      used: adminGenerationCount,
      remaining: Math.max(ADMIN_GENERATION_LIMIT - adminGenerationCount, 0),
      canGenerate: (windowExpired || !expiresAt) && adminGenerationCount < ADMIN_GENERATION_LIMIT
    }
  };
};

const canSelfGenerateStaffId = (user, now = new Date()) => {
  ensureSelfWindow(user, now);
  const controls = getCredentialControls(user, now);

  if (controls.selfService.windowExpired) {
    return {
      allowed: false,
      message: 'Self-service Staff ID generation has expired after 24 hours. Please contact admin for assistance.',
      controls
    };
  }

  if (!controls.selfService.staffId.canGenerate) {
    return {
      allowed: false,
      message: 'You have reached the self-service Staff ID generation limit (2). Write down your current credentials safely.',
      controls
    };
  }

  return { allowed: true, controls };
};

const registerSelfStaffIdGeneration = (user) => {
  user.staffIdSelfGenerationCount = Number(user.staffIdSelfGenerationCount || 0) + 1;
};

const canSelfGenerateRecoveryCode = (user, now = new Date()) => {
  ensureSelfWindow(user, now);
  const controls = getCredentialControls(user, now);

  return {
    allowed: false,
    message: 'Recovery code access is managed by administrators only. Contact admin for assistance.',
    controls
  };
};

const registerSelfRecoveryCodeGeneration = (user) => {
  user.recoveryCodeSelfGenerationCount = Number(user.recoveryCodeSelfGenerationCount || 0) + 1;
};

const canAdminGenerateCredentials = (user, now = new Date()) => {
  const controls = getCredentialControls(user, now);

  if (controls.selfService.expiresAt && !controls.selfService.windowExpired) {
    return {
      allowed: false,
      message: 'Admin regeneration is available only after the user self-service window expires (24 hours).',
      controls
    };
  }

  if (!controls.adminService.canGenerate) {
    return {
      allowed: false,
      message: 'Admin generation limit reached (5). No further credential regeneration is allowed.',
      controls
    };
  }

  return { allowed: true, controls };
};

const registerAdminCredentialGeneration = (user) => {
  user.adminCredentialGenerationCount = Number(user.adminCredentialGenerationCount || 0) + 1;
};

module.exports = {
  SELF_GENERATION_LIMIT,
  SELF_WINDOW_HOURS,
  ADMIN_GENERATION_LIMIT,
  ensureSelfWindow,
  getCredentialControls,
  canSelfGenerateStaffId,
  registerSelfStaffIdGeneration,
  canSelfGenerateRecoveryCode,
  registerSelfRecoveryCodeGeneration,
  canAdminGenerateCredentials,
  registerAdminCredentialGeneration
};
