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

/**
 * Fetches all currently existing UIDs and lowercased emails from Firebase Authentication.
 * Used to exclude orphaned Firestore `users` documents whose accounts were manually deleted in Firebase Auth.
 */
export async function getActiveAuthUserSets(): Promise<{
  uids: Set<string>;
  emails: Set<string>;
} | null> {
  if (!adminAuth) return null;
  try {
    const uids = new Set<string>();
    const emails = new Set<string>();
    let nextPageToken: string | undefined = undefined;
    do {
      const listResult: any = await adminAuth.listUsers(1000, nextPageToken);
      (listResult.users || []).forEach((u: any) => {
        if (u.uid) uids.add(u.uid);
        if (u.email) emails.add(String(u.email).trim().toLowerCase());
      });
      nextPageToken = listResult.pageToken;
    } while (nextPageToken);
    return { uids, emails };
  } catch (err) {
    console.warn('⚠️ Could not list Firebase Auth users for sync check:', err);
    return null;
  }
}

export function isUserPresentInAuth(
  user: { id?: string; uid?: string; email?: string | null },
  authSets: { uids: Set<string>; emails: Set<string> } | null
): boolean {
  if (!authSets) return true;
  if (user.id && authSets.uids.has(user.id)) return true;
  if (user.uid && authSets.uids.has(user.uid)) return true;
  if (user.email && authSets.emails.has(String(user.email).trim().toLowerCase())) {
    return true;
  }
  return false;
}

export default admin;
