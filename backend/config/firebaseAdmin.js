const admin = require('firebase-admin');

const parsePrivateKey = (privateKey) => {
  if (!privateKey) return null;
  return privateKey.replace(/\\n/g, '\n');
};

const isFirebaseAdminConfigured = () => {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
};

const getFirebaseAdmin = () => {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  if (admin.apps.length > 0) {
    return admin;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    })
  });

  return admin;
};

module.exports = {
  getFirebaseAdmin,
  isFirebaseAdminConfigured
};