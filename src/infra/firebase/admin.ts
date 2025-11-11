import admin from 'firebase-admin';
import 'firebase-admin/storage';

import { getEnv } from '../../main/config/env.js';

let app: admin.app.App | null = null;

export function getFirebaseApp() {
  if (app) return app;
  const {
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_CLIENT_EMAIL: clientEmail,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_STORAGE_BUCKET,
  } = getEnv();
  let privateKey = FIREBASE_PRIVATE_KEY;
  if (privateKey && privateKey.startsWith('-----')) {
    // OK
  } else if (privateKey) {
    // When coming from .env with escaped \n
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // All required env validated in getEnv(); no need for extra check here.

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    } as admin.ServiceAccount),
    storageBucket: FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  });
  return app;
}

export async function verifyIdToken(idToken: string) {
  const firebase = getFirebaseApp();
  const decoded = await firebase.auth().verifyIdToken(idToken);
  return decoded;
}

export async function sendNotification(token: string, title: string, body: string) {
  const firebase = getFirebaseApp();
  const message: admin.messaging.TokenMessage = {
    token,
    notification: { title, body },
  };
  return firebase.messaging().send(message);
}

export function getDefaultBucket() {
  const firebase = getFirebaseApp();
  return firebase.storage().bucket();
}
