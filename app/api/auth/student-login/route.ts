import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

interface StudentLoginRequest {
    email: string;
    loginId: string;
    deviceId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: StudentLoginRequest = await request.json();
        const { email, loginId, deviceId } = body;

        if (!email || !loginId || !deviceId) {
            return NextResponse.json(
                { error: 'Email, Login ID, and Device ID are required' },
                { status: 400 }
            );
        }

        // Check if Admin SDK is initialized
        if (!adminAuth || !adminDb) {
            return NextResponse.json(
                { error: 'Login service temporarily unavailable' },
                { status: 503 }
            );
        }

        // Find user in Firestore with this email and loginId
        const userSnapshot = await (adminDb as any)
            .collection('users')
            .where('email', '==', email)
            .where('loginId', '==', loginId)
            .limit(1)
            .get();

        if (userSnapshot.empty) {
            return NextResponse.json(
                { error: 'Invalid email or Login ID' },
                { status: 401 }
            );
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        // Check if student is blocked
        if (userData.isBlocked === true) {
            return NextResponse.json(
                { error: 'Your account has been blocked. Please contact support.' },
                { status: 403 }
            );
        }

        // Security Check: Single Device Login
        if (userData.deviceId && userData.deviceId !== deviceId) {
            return NextResponse.json(
                { error: 'Your already login in another device' },
                { status: 403 }
            );
        }

        // If no deviceId stored yet, store it
        if (!userData.deviceId) {
            await userDoc.ref.update({ deviceId });
        }

        const uid = userData.uid;
        const enrolledCourses = userData.enrolledCourses || [];

        // Authenticate using Firebase REST API with loginId as password
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Firebase API key not configured' },
                { status: 500 }
            );
        }

        const authResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password: loginId,
                    returnSecureToken: true,
                }),
            }
        );

        const authData = await authResponse.json();

        if (!authResponse.ok) {
            console.error('Firebase REST API error:', authData);
            return NextResponse.json(
                { error: 'Authentication failed' },
                { status: 401 }
            );
        }

        const idToken = authData.idToken;

        // Build full user payload from DB to store in cookie
        const userPayload = {
            uid,
            email: authData.email,
            fullName: userData.fullName || '',
            loginId: userData.loginId || loginId,
            role: 'student',
            isBlocked: userData.isBlocked || false,
            enrolledCourses,
            deviceId: userData.deviceId || deviceId,
            createdAt: userData.createdAt || null,
            createdByAdminName: userData.createdByAdminName || null,
            photoURL: userData.photoURL || null,
        };

        const response = NextResponse.json(
            {
                success: true,
                message: 'Login successful',
                user: userPayload,
                idToken,
            },
            { status: 200 }
        );

        const cookieOptions = {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        };

        // Store full user object as JSON cookie
        response.cookies.set('userData', JSON.stringify(userPayload), cookieOptions);

        response.cookies.set('authToken', idToken, { ...cookieOptions, httpOnly: true });
        response.cookies.set('role', 'student', cookieOptions);
        response.cookies.set('uid', uid, { ...cookieOptions, httpOnly: true });
        response.cookies.set('fullName', userData.fullName || '', cookieOptions);
        response.cookies.set('email', authData.email || '', cookieOptions);

        return response;
    } catch (error: any) {
        console.error('Student login error:', error);
        return NextResponse.json(
            { error: error.message || 'Login failed' },
            { status: 500 }
        );
    }
}
