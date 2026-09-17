import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, setLogLevel } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

// Initialize Firebase App safely
let appInstance: FirebaseApp;
try {
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('[Firebase] initializeApp fallback:', e);
  appInstance = getApp();
}
export const app: FirebaseApp = appInstance;

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Suppress benign connection pool warnings in the console logs
try {
  setLogLevel('error');
} catch {
  // ignore
}

// Initialize Firestore (with databaseId fallback) and force long polling
const configuredDbId = firebaseConfigData.firestoreDatabaseId;
let firestoreInstance: Firestore;

try {
  if (configuredDbId && configuredDbId !== '(default)') {
    try {
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true
      }, configuredDbId);
    } catch (primaryErr) {
      console.warn('[Firebase] Failed to initialize named database, falling back to default:', primaryErr);
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true
      });
    }
  } else {
    firestoreInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
  }
} catch (e) {
  try {
    firestoreInstance = getFirestore(app);
  } catch (err) {
    console.error('[Firebase] Firestore fallback error:', err);
    firestoreInstance = getFirestore(app);
  }
}

export const db: Firestore = firestoreInstance;
export default app;

