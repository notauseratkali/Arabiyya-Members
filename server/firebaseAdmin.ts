import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;
let initError: string | null = null;
let clientEmail: string | null = null;
let projectId: string | null = null;

export function initFirebaseAdmin(): { success: boolean; app: App | null; error?: string } {
  if (adminApp) {
    return { success: true, app: adminApp };
  }

  try {
    let serviceAccountObj: any = null;

    // 1. Check environment variable FIREBASE_SERVICE_ACCOUNT
    const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (rawEnv && rawEnv.trim()) {
      const trimmed = rawEnv.trim();
      if (trimmed.startsWith('{')) {
        serviceAccountObj = JSON.parse(trimmed);
      } else {
        // Might be a base64 encoded JSON or a file path
        try {
          const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
          if (decoded.trim().startsWith('{')) {
            serviceAccountObj = JSON.parse(decoded);
          }
        } catch {
          // If not base64, check if it's a file path
          if (fs.existsSync(trimmed)) {
            serviceAccountObj = JSON.parse(fs.readFileSync(trimmed, 'utf8'));
          }
        }
      }
    }

    // 2. Check GOOGLE_APPLICATION_CREDENTIALS file path
    if (!serviceAccountObj && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (fs.existsSync(credsPath)) {
        serviceAccountObj = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
      }
    }

    // 3. Check standard local files in project root
    const possiblePaths = [
      path.resolve(process.cwd(), 'serviceAccountKey.json'),
      path.resolve(process.cwd(), 'service-account.json'),
      path.resolve(process.cwd(), 'firebase-service-account.json')
    ];

    if (!serviceAccountObj) {
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          serviceAccountObj = JSON.parse(fs.readFileSync(p, 'utf8'));
          break;
        }
      }
    }

    if (!serviceAccountObj) {
      return { success: false, app: null, error: 'No service account key found in environment or local files.' };
    }

    if (!serviceAccountObj.project_id || !serviceAccountObj.private_key) {
      initError = 'Service account object is missing project_id or private_key.';
      return { success: false, app: null, error: initError };
    }

    projectId = serviceAccountObj.project_id;
    clientEmail = serviceAccountObj.client_email || null;

    if (getApps().length > 0) {
      adminApp = getApp();
    } else {
      adminApp = initializeApp({
        credential: cert(serviceAccountObj),
        projectId: serviceAccountObj.project_id
      });
    }

    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    initError = null;

    console.log(`[Firebase Admin] Successfully initialized for project "${projectId}" (${clientEmail || 'no client_email'})`);
    return { success: true, app: adminApp };
  } catch (err: any) {
    initError = err.message || String(err);
    console.warn('[Firebase Admin] Initialization warning:', initError);
    return { success: false, app: null, error: initError };
  }
}

// Automatically attempt safe initialization on module load
try {
  initFirebaseAdmin();
} catch (e: any) {
  initError = e.message;
}

export function getFirebaseAdminStatus() {
  return {
    initialized: Boolean(adminApp),
    projectId: projectId || (adminApp ? adminApp.options.projectId : null),
    clientEmail: clientEmail,
    error: initError
  };
}

export { adminApp, adminDb, adminAuth };

