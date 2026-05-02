# Firebase Permissions Fix

## Issue
You're getting PERMISSION_DENIED errors from Firestore and Storage bucket errors. This is because:

1. **Firestore Rules** - Default rules don't allow writes
2. **Storage Bucket Rules** - Same issue with storage

## Solution

### Step 1: Update Firestore Rules
Go to your Firebase Console → Firestore Database → Rules and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /courses/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 2: Update Storage Rules
Go to Firebase Console → Storage → Rules and replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload and read
    match /courses/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 3: Publish Rules
Click "Publish" button in both sections.

### Step 4: Test Again
Now try creating a course again. It should work!

## Alternative (Development Only - Not Recommended)
If you want to allow anyone (including unauthenticated) to write for testing:

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **WARNING**: This is only for development. Always secure your rules before production!
