import { NextRequest, NextResponse } from 'next/server';

interface GoogleAuthRequest {
  idToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GoogleAuthRequest = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
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

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error: 'Google login temporarily unavailable. Please configure Firebase Admin SDK.',
          code: 'ADMIN_SDK_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name;
    const picture = decodedToken.picture;

    // Check if user exists in Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (userDoc.exists) {
      // User already exists, return success
      return NextResponse.json(
        {
          success: true,
          message: 'User already exists',
          user: userDoc.data(),
        },
        { status: 200 }
      );
    }

    // Create new user in Firestore
    const userData = {
      uid,
      email,
      fullName: name || 'Google User',
      photoURL: picture || null,
      role: 'user', // Ensure role is set
      isBlocked: false, // Default to not blocked
      createdAt: new Date(),
      authProvider: 'google',
    };

    await adminDb.collection('users').doc(uid).set(userData);

    return NextResponse.json(
      {
        success: true,
        message: 'User registered with Google successfully',
        user: userData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Google authentication error:', error);

    if (error.code === 'auth/argument-error' || error.message.includes('Illegal argument')) {
      return NextResponse.json(
        { error: 'Invalid ID token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Google authentication failed' },
      { status: 500 }
    );
  }
}
