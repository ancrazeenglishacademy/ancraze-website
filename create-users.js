const fs = require('fs');
const admin = require('firebase-admin');

async function createUsers() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envFile.split('\n').forEach(line => {
    const index = line.indexOf('=');
    if (index > -1) {
      const key = line.substring(0, index).trim();
      const value = line.substring(index + 1).trim();
      env[key] = value;
    }
  });

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY) {
    console.error("Missing FIREBASE_PRIVATE_KEY in .env.local");
    process.exit(1);
  }

  let privateKey = env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  // VERY IMPORTANT: replace literal '\n' characters with actual newline characters
  privateKey = privateKey.replace(/\\n/g, '\n');

  console.log("Using Project ID:", env.FIREBASE_PROJECT_ID);
  console.log("Using Client Email:", env.FIREBASE_CLIENT_EMAIL);

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });

  const db = admin.firestore();
  const auth = admin.auth();

  const usersToCreate = [
    { email: 'superadmin@gmail.com', password: 'superadmin123', role: 'superadmin', fullName: 'Super Admin' },
    { email: 'admin@gmail.com', password: 'admin123', role: 'admin', fullName: 'System Admin' },
    { email: 'trainer@gmail.com', password: 'trainer123', role: 'trainer', fullName: 'Lead Trainer' }
  ];

  for (const user of usersToCreate) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(user.email);
        console.log(`User ${user.email} already exists in Auth. Updating password...`);
        await auth.updateUser(userRecord.uid, { password: user.password });
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          console.log(`Creating user ${user.email} in Auth...`);
          userRecord = await auth.createUser({
            email: user.email,
            password: user.password,
            displayName: user.fullName
          });
        } else {
          throw err;
        }
      }

      console.log(`Saving ${user.email} to Firestore 'users' collection...`);
      await db.collection('users').doc(userRecord.uid).set({
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`✅ Successfully setup ${user.email} as ${user.role}`);

    } catch (error) {
      console.error(`❌ Error setting up ${user.email}:`, error.message);
    }
  }
  console.log("Done!");
  process.exit(0);
}

createUsers();
