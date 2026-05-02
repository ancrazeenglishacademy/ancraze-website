import * as admin from 'firebase-admin';

/**
 * Validates that specific service account information is available in environment variables.
 * @returns true if the configuration exists, false otherwise.
 */
function isConfigured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * @returns The initialized admin object or null if not configured.
 */
function getAdmin(): typeof admin | null {
  if (admin.apps.length > 0) {
    return admin;
  }

  if (!isConfigured()) {
    console.warn(
      'Firebase Admin SDK credentials not configured. Please add FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL to .env.local'
    );
    return null;
  }

  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY as string;

    // Remove surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }

    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    return null;
  }
}

const initializedAdmin = getAdmin();

export const adminAuth = initializedAdmin ? initializedAdmin.auth() as any : null;
export const adminDb = initializedAdmin ? initializedAdmin.firestore() as any : null;
export const adminStorage = initializedAdmin ? initializedAdmin.storage() as any : null;

export default admin;
