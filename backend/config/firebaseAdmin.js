import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let admin = null;
let adminAuth = null;

try {
  const firebaseAdminModule = await import('firebase-admin');
  const firebaseAppModule = await import('firebase-admin/app');
  const firebaseAuthModule = await import('firebase-admin/auth');

  admin = firebaseAdminModule.default || firebaseAdminModule;
  const initializeApp = firebaseAppModule.initializeApp;
  const cert = firebaseAppModule.cert;
  const getApps = firebaseAppModule.getApps;
  const getAuth = firebaseAuthModule.getAuth;

  const activeApps = getApps();
  let firebaseAdminApp = null;

  if (!activeApps || activeApps.length === 0) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
      ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : path.join(process.cwd(), 'firebase-service-account.json');

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      firebaseAdminApp = initializeApp({ credential: cert(serviceAccount) });
      console.log('✅ Firebase Admin SDK initialized with FIREBASE_SERVICE_ACCOUNT_JSON');
    } else if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      firebaseAdminApp = initializeApp({ credential: cert(serviceAccount) });
      console.log(`✅ Firebase Admin SDK initialized with file: ${serviceAccountPath}`);
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'hostelinventorysystem';
      firebaseAdminApp = initializeApp({ projectId: projectId });
      console.log(`⚠️ Firebase Admin SDK initialized with Project ID (${projectId}). Place firebase-service-account.json in /server to verify live Firebase ID Tokens.`);
    }
  } else {
    firebaseAdminApp = activeApps[0];
  }

  adminAuth = getAuth(firebaseAdminApp);
} catch (e) {
  console.warn("⚠️ Note: 'firebase-admin' package is not installed in server node_modules yet. Run 'cd server && npm install firebase-admin' to enable live server-side token verification.");
}

export { adminAuth };
export default admin;
