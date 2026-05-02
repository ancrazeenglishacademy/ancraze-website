import { NextRequest, NextResponse } from 'next/server';

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, fullName } = body;

    // console.log("body",body)

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, fullName' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Dynamic import to catch initialization errors
    let adminAuth, adminDb;
    try {
      const firebaseAdmin = await import('@/lib/firebaseAdmin');
      adminAuth = firebaseAdmin.adminAuth;
      adminDb = firebaseAdmin.adminDb;
    } catch (importError: any) {
      console.error('Firebase Admin Import Error:', importError);
      return NextResponse.json(
        {
          error: 'Server misconfiguration: Firebase Admin SDK failed to load.',
          details: importError.message
        },
        { status: 500 }
      );
    }

    // Check if Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error: 'Registration temporarily unavailable. Please configure Firebase Admin SDK credentials in .env.local',
          code: 'ADMIN_SDK_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Check if user already exists
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    // Create user with Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // Save user data to Firestore with role
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      fullName,
      role: 'user', // Default to User role
      isBlocked: false, // Default to not blocked
      createdAt: new Date(),
      authProvider: 'email',
      photoURL: null,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          fullName,
          role: 'user',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle Firebase specific errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 409 }
      );
    }
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
