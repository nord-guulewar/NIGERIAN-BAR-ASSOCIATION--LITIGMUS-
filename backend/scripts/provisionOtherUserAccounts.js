const { connectDB, closeDB } = require('../config/postgres');
const User = require('../models/User');

const DEFAULT_PASSWORD = 'RoleUser@123';

const accountsToProvision = [
  {
    firstName: 'John',
    lastName: 'Registrar',
    email: 'registrar@nba.org.ng',
    role: 'registrar',
    phoneNumber: '08023456789',
    state: 'LA',
    lga: 'Ikeja',
    court: 'SHC',
    department: 'Registry'
  },
  {
    firstName: 'Sarah',
    lastName: 'Clerk',
    email: 'clerk@nba.org.ng',
    role: 'clerk',
    phoneNumber: '08034567890',
    state: 'LA',
    lga: 'Shomolu',
    court: 'SHC',
    department: 'Registry'
  },
  {
    firstName: 'Michael',
    lastName: 'Accountant',
    email: 'accountant@nba.org.ng',
    role: 'accountant',
    phoneNumber: '08045678901',
    state: 'FC',
    lga: 'Abuja Municipal',
    court: 'FHC',
    department: 'Accounts'
  },
  {
    firstName: 'David',
    lastName: 'Bailiff',
    email: 'bailiff@nba.org.ng',
    role: 'bailiff',
    phoneNumber: '08056789012',
    state: 'LA',
    lga: 'Ojo',
    court: 'MC',
    department: 'Registry'
  },
  {
    firstName: 'Grace',
    lastName: 'Secretary',
    email: 'secretary@nba.org.ng',
    role: 'secretary',
    phoneNumber: '08067890123',
    state: 'FC',
    lga: 'Gwagwalada',
    court: 'FHC',
    department: 'Registry'
  },
  {
    firstName: 'Rita',
    lastName: 'Records',
    email: 'records@nba.org.ng',
    role: 'record_officer',
    phoneNumber: '08034445555',
    state: 'FC',
    lga: 'Bwari',
    court: 'FHC',
    department: 'Records'
  },
  {
    firstName: 'Peter',
    lastName: 'Reporter',
    email: 'reporter@nba.org.ng',
    role: 'court_reporter',
    phoneNumber: '08045556666',
    state: 'LA',
    lga: 'Surulere',
    court: 'SHC',
    department: 'Registry'
  },
  {
    firstName: 'Uche',
    lastName: 'Usher',
    email: 'usher@nba.org.ng',
    role: 'usher',
    phoneNumber: '08056667777',
    state: 'FC',
    lga: 'Kuje',
    court: 'FHC',
    department: 'Registry'
  },
  {
    firstName: 'Sam',
    lastName: 'Security',
    email: 'security@nba.org.ng',
    role: 'security',
    phoneNumber: '08067778888',
    state: 'LA',
    lga: 'Ikeja',
    court: 'SHC',
    department: 'Administration'
  },
  {
    firstName: 'Lola',
    lastName: 'Librarian',
    email: 'librarian@nba.org.ng',
    role: 'librarian',
    phoneNumber: '08078889999',
    state: 'FC',
    lga: 'Abaji',
    court: 'FHC',
    department: 'Library'
  },
  {
    firstName: 'Tunde',
    lastName: 'Litigation',
    email: 'litigation@nba.org.ng',
    role: 'litigation',
    phoneNumber: '08089990000',
    state: 'LA',
    lga: 'Yaba',
    court: 'SHC',
    department: 'Civil'
  },
  {
    firstName: 'Ada',
    lastName: 'Prosecutor',
    email: 'prosecutor@nba.org.ng',
    role: 'prosecutor',
    phoneNumber: '08090001111',
    state: 'FC',
    lga: 'Abuja Municipal',
    court: 'FHC',
    department: 'Criminal'
  },
  {
    firstName: 'Femi',
    lastName: 'Probate',
    email: 'probate@nba.org.ng',
    role: 'probate',
    phoneNumber: '08001112222',
    state: 'LA',
    lga: 'Eti-Osa',
    court: 'SHC',
    department: 'Probate'
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@nba.org.ng',
    role: 'admin',
    phoneNumber: '08012345678',
    state: 'FC',
    lga: 'Abuja Municipal',
    court: 'FHC',
    department: 'Administration'
  }
];

async function upsertAccount(account) {
  const existing = await User.findOne({ email: account.email }).select('+password');

  if (existing) {
    existing.firstName = account.firstName;
    existing.lastName = account.lastName;
    existing.role = account.role;
    existing.phoneNumber = account.phoneNumber;
    existing.state = account.state;
    existing.lga = account.lga;
    existing.court = account.court;
    existing.department = account.department;
    existing.isActive = true;
    existing.isVerified = true;
    existing.accountStatus = 'active';
    existing.emailConfirmedAt = existing.emailConfirmedAt || new Date();

    await existing.save();
    return { status: 'updated', account: existing };
  }

  const created = await User.create({
    ...account,
    password: DEFAULT_PASSWORD,
    isActive: true,
    isVerified: true,
    accountStatus: 'active',
    emailConfirmedAt: new Date(),
    courtDivision: 'Main'
  });

  return { status: 'created', account: created };
}

async function verifyReadiness(account) {
  const user = await User.findOne({ email: account.email }).select('+password');
  if (!user) {
    return { email: account.email, ready: false, reason: 'missing_user' };
  }

  const passwordMatches = await user.comparePassword(DEFAULT_PASSWORD);
  const verificationReady = Boolean(user.isVerified);
  const activeReady = Boolean(user.isActive);
  const loginPortal = user.role === 'admin' ? 'admin-login' : 'other-user-login';

  return {
    email: user.email,
    role: user.role,
    ready: passwordMatches && verificationReady && activeReady,
    passwordMatches,
    verificationReady,
    activeReady,
    loginPortal
  };
}

async function run() {
  try {
    await connectDB();

    const cashier = await User.findOne({ role: 'cashier' });
    if (cashier) {
      console.log(`Cashier account already exists and was not modified: ${cashier.email}`);
    } else {
      console.log('No cashier account found. Skipping cashier creation as requested.');
    }

    const provisionResults = [];

    for (const account of accountsToProvision) {
      if (account.role === 'cashier') continue;
      const result = await upsertAccount(account);
      provisionResults.push(result);
    }

    const readiness = [];
    for (const account of accountsToProvision) {
      if (account.role === 'cashier') continue;
      readiness.push(await verifyReadiness(account));
    }

    console.log('\nProvision Summary');
    console.log('-----------------');
    provisionResults.forEach((result) => {
      console.log(`${result.status.toUpperCase()}: ${result.account.email} (${result.account.role})`);
    });

    console.log('\nLogin Readiness Check');
    console.log('---------------------');
    readiness.forEach((entry) => {
      console.log(
        `${entry.ready ? 'READY' : 'NOT READY'}: ${entry.email} (${entry.role}) | portal=${entry.loginPortal} | verified=${entry.verificationReady} | active=${entry.activeReady} | password=${entry.passwordMatches}`
      );
    });

    console.log(`\nShared password for all provisioned accounts: ${DEFAULT_PASSWORD}`);

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Provisioning failed:', error);
    process.exit(1);
  }
}

run();
