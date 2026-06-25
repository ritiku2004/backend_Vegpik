const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let app = null;
let messaging = null;

try {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
  } = process.env;

  if (
    FIREBASE_PROJECT_ID &&
    FIREBASE_CLIENT_EMAIL &&
    FIREBASE_PRIVATE_KEY
  ) {
    const serviceAccount = {
      projectId: FIREBASE_PROJECT_ID.trim(),
      clientEmail: FIREBASE_CLIENT_EMAIL.trim(),
      privateKey: FIREBASE_PRIVATE_KEY
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\\+n/g, '\n')
        .replace(/\r/g, '')
        .replace(/\n+/g, '\n')
        .trim()
    };

    app = initializeApp({
      credential: cert(serviceAccount)
    });

    messaging = getMessaging(app);

    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.warn(
      '⚠️ Firebase environment variables are missing. Firebase Admin not initialized.'
    );
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:');
  console.error(error);
}

module.exports = {
  app,
  messaging
};