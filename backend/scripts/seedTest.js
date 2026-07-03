require('dotenv').config();

const { connectDB, closeDB } = require('../config/postgres');
const User = require('../models/User');
const Judge = require('../models/Judge');

const UserModel = User.Model;
const JudgeModel = Judge.Model;
const seededEmailConfirmedAt = new Date('2026-01-01T00:00:00.000Z');

const testUsers = [
  {
    firstName: 'CI',
    lastName: 'Admin',
    email: 'ci-admin@nba.test',
    password: 'Admin@Test123',
    role: 'admin',
    phoneNumber: '08010000001',
    state: 'FC',
    court: 'FHC',
    isActive: true,
    isVerified: true,
    emailConfirmedAt: seededEmailConfirmedAt,
    accountStatus: 'active'
  },
  {
    firstName: 'CI',
    lastName: 'Registrar',
    email: 'ci-registrar@nba.test',
    password: 'Registrar@Test123',
    role: 'registrar',
    phoneNumber: '08010000002',
    state: 'LA',
    lga: 'Ikeja',
    court: 'SHC',
    isActive: true,
    isVerified: true,
    emailConfirmedAt: seededEmailConfirmedAt,
    accountStatus: 'active'
  }
];

const testJudges = [
  {
    firstName: 'CI',
    lastName: 'Judge',
    title: 'Judge',
    email: 'ci-judge@nba.test',
    phoneNumber: '08010000003',
    courtType: 'SHC',
    state: 'LA',
    specialization: ['Civil'],
    maxDailyCases: 3,
    appointmentDate: new Date('2020-01-01'),
    isActive: true
  }
];

async function upsertByUniqueKey(Model, uniqueKey, records) {
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
}

async function seedTestDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test seeding is blocked in production');
  }

  try {
    await connectDB();

    const userResult = await upsertByUniqueKey(UserModel, 'email', testUsers);
    const judgeResult = await upsertByUniqueKey(JudgeModel, 'email', testJudges);

    console.log(`Test users seeded: ${userResult.createdCount} created, ${userResult.updatedCount} updated`);
    console.log(`Test judges seeded: ${judgeResult.createdCount} created, ${judgeResult.updatedCount} updated`);
  } catch (error) {
    console.error('Test seed error:', error);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

seedTestDatabase();