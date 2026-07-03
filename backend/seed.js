const { connectDB, closeDB } = require('./config/postgres');
require('dotenv').config();

const User = require('./models/User');
const Judge = require('./models/Judge');

const UserModel = User.Model;
const JudgeModel = Judge.Model;
const seedMode = (process.env.SEED_MODE || 'upsert').toLowerCase();
const isDestructiveSeed = seedMode === 'reset';
const seededEmailConfirmedAt = new Date('2026-01-01T00:00:00.000Z');

const ensureSafeSeedMode = () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is blocked in production');
  }

  if (isDestructiveSeed && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('Destructive seed blocked. Set ALLOW_DESTRUCTIVE_SEED=true to use SEED_MODE=reset');
  }
};

const upsertByUniqueKey = async (Model, uniqueKey, records) => {
  let createdCount = 0;
  let updatedCount = 0;

  for (const record of records) {
    const existingRecord = await Model.findOne({ where: { [uniqueKey]: record[uniqueKey] } });

    if (existingRecord) {
      await existingRecord.update(record);
      updatedCount += 1;
    } else {
      await Model.create(record);
      createdCount += 1;
    }
  }

  return { createdCount, updatedCount };
};

const seedUsers = async () => {
  try {
    ensureSafeSeedMode();
    await connectDB();

    console.log('Connected to PostgreSQL');

    if (isDestructiveSeed) {
      await User.deleteMany({});
      await Judge.deleteMany({});
      console.log('Cleared existing data');
    } else {
      console.log('Running idempotent seed in upsert mode');
    }

     const users = [
       {
         firstName: 'Admin',
         lastName: 'User',
         email: 'admin@nba.org.ng',
         password: 'Admin@123',
         role: 'admin',
         phoneNumber: '08012345678',
         state: 'FC',
         court: 'FHC',
         isActive: true
       },
       {
         firstName: 'James',
         lastName: 'Judge',
         email: 'judge@nba.org.ng',
         password: 'Judge@123',
         role: 'judge',
         phoneNumber: '08011112222',
         state: 'FC',
         lga: 'Abuja Municipal',
         court: 'FHC',
         isActive: true
       },
       {
         firstName: 'John',
         lastName: 'Registrar',
         email: 'registrar@nba.org.ng',
         password: 'Registrar@123',
         role: 'registrar',
         phoneNumber: '08023456789',
         state: 'LA',
         lga: 'Ikeja',
         court: 'SHC',
         isActive: true
       },
       {
         firstName: 'Sarah',
         lastName: 'Clerk',
         email: 'clerk@nba.org.ng',
         password: 'Clerk@123',
         role: 'clerk',
         phoneNumber: '08034567890',
         state: 'LA',
         lga: 'Shomolu',
         court: 'SHC',
         isActive: true
       },
       {
         firstName: 'Michael',
         lastName: 'Accountant',
         email: 'accountant@nba.org.ng',
         password: 'Accountant@123',
         role: 'accountant',
         phoneNumber: '08045678901',
         state: 'FC',
         lga: 'Abuja Municipal',
         court: 'FHC',
         isActive: true
       },
       {
         firstName: 'David',
         lastName: 'Bailiff',
         email: 'bailiff@nba.org.ng',
         password: 'Bailiff@123',
         role: 'bailiff',
         phoneNumber: '08056789012',
         state: 'LA',
         lga: 'Ojo',
         court: 'MC',
         isActive: true
       },
       {
         firstName: 'Grace',
         lastName: 'Secretary',
         email: 'secretary@nba.org.ng',
         password: 'Secretary@123',
         role: 'secretary',
         phoneNumber: '08067890123',
         state: 'FC',
         lga: 'Gwagwalada',
         court: 'FHC',
         isActive: true
       },
       {
         firstName: 'Bisi',
         lastName: 'Cashier',
         email: 'cashier@nba.org.ng',
         password: 'Cashier@123',
         role: 'cashier',
         phoneNumber: '08023334444',
         state: 'LA',
         lga: 'Eti-Osa',
         court: 'SHC',
         isActive: true
       },
       {
         firstName: 'Rita',
         lastName: 'Records',
         email: 'records@nba.org.ng',
         password: 'Records@123',
         role: 'record_officer',
         phoneNumber: '08034445555',
         state: 'FC',
         lga: 'Bwari',
         court: 'FHC',
         isActive: true
       },
       {
         firstName: 'Peter',
         lastName: 'Reporter',
         email: 'reporter@nba.org.ng',
         password: 'Reporter@123',
         role: 'court_reporter',
         phoneNumber: '08045556666',
         state: 'LA',
         lga: 'Surulere',
         court: 'SHC',
         isActive: true
       },
       {
         firstName: 'Uche',
         lastName: 'Usher',
         email: 'usher@nba.org.ng',
         password: 'Usher@123',
         role: 'usher',
         phoneNumber: '08056667777',
         state: 'FC',
         lga: 'Kuje',
         court: 'FHC',
         isActive: true
       },
       {
         firstName: 'Sam',
         lastName: 'Security',
         email: 'security@nba.org.ng',
         password: 'Security@123',
         role: 'security',
         phoneNumber: '08067778888',
         state: 'LA',
         lga: 'Ikeja',
         court: 'SHC',
         isActive: true
       },
       {
         firstName: 'Lola',
         lastName: 'Librarian',
         email: 'librarian@nba.org.ng',
         password: 'Librarian@123',
         role: 'librarian',
         phoneNumber: '08078889999',
         state: 'FC',
         lga: 'Abaji',
         court: 'FHC',
         isActive: true
       },
       {
         firstName: 'Tunde',
         lastName: 'Litigation',
         email: 'litigation@nba.org.ng',
         password: 'Litigation@123',
         role: 'litigation',
         phoneNumber: '08089990000',
         state: 'LA',
         lga: 'Yaba',
         court: 'SHC',
         isActive: true
       },
       {
         firstName: 'Ada',
         lastName: 'Prosecutor',
         email: 'prosecutor@nba.org.ng',
         password: 'Prosecutor@123',
         role: 'prosecutor',
         phoneNumber: '08090001111',
         state: 'FC',
         lga: 'Abuja Municipal',
         court: 'FHC',
         isActive: true
       },
       {
         firstName: 'Femi',
         lastName: 'Probate',
         email: 'probate@nba.org.ng',
         password: 'Probate@123',
         role: 'probate',
         phoneNumber: '08001112222',
         state: 'LA',
         lga: 'Lekki',
         court: 'SHC',
         isActive: true
       }
     ].map((user) => ({
       ...user,
       isVerified: true,
       emailConfirmedAt: seededEmailConfirmedAt,
       accountStatus: 'active'
     }));

    const userSeedResult = isDestructiveSeed
      ? { createdCount: (await User.create(users)).length, updatedCount: 0 }
      : await upsertByUniqueKey(UserModel, 'email', users);

    console.log(`Users seeded: ${userSeedResult.createdCount} created, ${userSeedResult.updatedCount} updated`);

    const judges = [
      {
        firstName: 'Oluwaseun',
        lastName: 'Adeyemi',
        title: 'Justice',
        email: 'judge.adeyemi@nba.org.ng',
        phoneNumber: '08078901234',
        courtType: 'SHC',
        state: 'LA',
        specialization: ['Civil', 'Commercial', 'Land'],
        maxDailyCases: 5,
        appointmentDate: new Date('2015-01-15'),
        isActive: true
      },
      {
        firstName: 'Amina',
        lastName: 'Mohammed',
        title: 'Judge',
        email: 'judge.mohammed@nba.org.ng',
        phoneNumber: '08089012345',
        courtType: 'FHC',
        state: 'FC',
        specialization: ['Criminal', 'Constitutional'],
        maxDailyCases: 4,
        appointmentDate: new Date('2017-03-20'),
        isActive: true
      },
      {
        firstName: 'Chukwuemeka',
        lastName: 'Okafor',
        title: 'Judge',
        email: 'judge.okafor@nba.org.ng',
        phoneNumber: '08090123456',
        courtType: 'SHC',
        state: 'AN',
        specialization: ['Family', 'Civil'],
        maxDailyCases: 6,
        appointmentDate: new Date('2018-06-10'),
        isActive: true
      },
      {
        firstName: 'Blessing',
        lastName: 'Eze',
        title: 'Magistrate',
        email: 'magistrate.eze@nba.org.ng',
        phoneNumber: '08001234567',
        courtType: 'MC',
        state: 'LA',
        specialization: ['Criminal', 'Civil'],
        maxDailyCases: 8,
        appointmentDate: new Date('2019-09-01'),
        isActive: true
      },
      {
        firstName: 'Ibrahim',
        lastName: 'Yusuf',
        title: 'Judge',
        email: 'judge.yusuf@nba.org.ng',
        phoneNumber: '08012345670',
        courtType: 'FHC',
        state: 'KN',
        specialization: ['Tax', 'Commercial'],
        maxDailyCases: 5,
        appointmentDate: new Date('2016-11-25'),
        isActive: true
      }
    ];

    const judgeSeedResult = isDestructiveSeed
      ? { createdCount: (await Judge.create(judges)).length, updatedCount: 0 }
      : await upsertByUniqueKey(JudgeModel, 'email', judges);

    console.log(`Judges seeded: ${judgeSeedResult.createdCount} created, ${judgeSeedResult.updatedCount} updated`);

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===\n');
    console.log(`Seed mode: ${seedMode}`);
    console.log('Login Credentials:');
    console.log('-------------------');
    users.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    console.log('\n');

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedUsers();
