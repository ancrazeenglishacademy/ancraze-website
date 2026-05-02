# Register API Documentation

This is a complete authentication system built with Next.js, Firebase, and Google Sign-In integration.

## Features

✅ Email/Password Registration  
✅ Google OAuth Authentication  
✅ Firestore Database Integration  
✅ Server-side user creation with Firebase Admin SDK  
✅ Client-side authentication hook  
✅ Automatic user profile storage  

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication methods:
   - Email/Password
   - Google Sign-In
4. Create a Firestore Database
5. Download Service Account Key from Project Settings → Service Accounts

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.local.example .env.local
```

**Client Config (Public):**
- Get from Firebase Console → Project Settings → Your apps
- Variables starting with `NEXT_PUBLIC_` are safe to expose

**Admin Config:**
- Download JSON from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- Fill in all `FIREBASE_*` variables

**Google OAuth:**
- Get from Google Cloud Console → APIs & Services → Credentials
- Create OAuth 2.0 Client ID for Web application

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

## API Endpoints

### POST `/api/auth/register`

Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Error Responses:**
- `400`: Missing fields or invalid format
- `409`: User already exists
- `500`: Server error

### POST `/api/auth/google`

Handle Google Sign-In authentication.

**Request:**
```json
{
  "idToken": "google_id_token"
}
```

**Response (201 Created or 200 OK):**
```json
{
  "success": true,
  "message": "User registered with Google successfully",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "fullName": "User Name",
    "photoURL": "profile_pic_url",
    "authProvider": "google"
  }
}
```

## Frontend Usage

### Using the Auth Hook

```tsx
'use client';

import { useAuth } from '@/lib/useAuth';

export default function RegisterPage() {
  const { registerWithEmail, signInWithGoogle, user, loading, error } = useAuth();

  const handleEmailRegister = async () => {
    try {
      await registerWithEmail('user@example.com', 'password123', 'John Doe');
      // Registration successful
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Sign-in successful
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (user) {
    return <div>Welcome, {user.email}</div>;
  }

  return (
    <div>
      <button onClick={handleEmailRegister}>Register with Email</button>
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

## Database Schema

### Users Collection

```
/users/{uid}
├── uid: string
├── email: string
├── fullName: string
├── photoURL: string | null
├── createdAt: timestamp
├── authProvider: 'email' | 'google'
└── ...additional fields
```

## Error Handling

The API includes comprehensive error handling for:
- Missing or invalid input
- Duplicate email addresses
- Firebase authentication errors
- Invalid ID tokens
- Database write failures

## Security Notes

⚠️ Never commit `.env.local` to version control  
⚠️ Keep Firebase Admin credentials secure  
⚠️ Use HTTPS in production  
⚠️ Implement rate limiting for production  
⚠️ Validate all inputs server-side  
⚠️ Use strong password requirements  

## File Structure

```
app/
├── api/
│   └── auth/
│       ├── register/
│       │   └── route.ts          # Email registration endpoint
│       └── google/
│           └── route.ts          # Google auth endpoint
lib/
├── firebase.ts                    # Client-side Firebase config
├── firebaseAdmin.ts               # Server-side Firebase Admin config
└── useAuth.ts                     # Auth hook for frontend
.env.local.example                 # Environment variables template
```

## Next Steps

1. Create a register form component
2. Add login/logout functionality
3. Implement protected routes
4. Add email verification
5. Implement password reset
6. Add role-based access control
