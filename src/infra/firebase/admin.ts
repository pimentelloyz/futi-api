import admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function getFirebaseApp() {
  if (app) return app;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && privateKey.startsWith('-----')) {
    // OK
  } else if (privateKey) {
    // When coming from .env with escaped \n
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in environment variables');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    } as admin.ServiceAccount),
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
