import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

function generateLoginId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: NextRequest) {
    try {
        if (!adminAuth || !adminDb) {
            return NextResponse.json(
                { error: 'Registration service temporarily unavailable' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { email, fullName } = body;

        if (!email || !fullName) {
            return NextResponse.json(
                { error: 'Email and Full Name are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        try {
            await (adminAuth as any).getUserByEmail(email);
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            );
        } catch (err: any) {
            if (err.code !== 'auth/user-not-found') throw err;
        }

        const loginId = generateLoginId();

        // Create user in Firebase Auth with loginId as password
        const userRecord = await (adminAuth as any).createUser({
            email,
            password: loginId,
            displayName: fullName,
        });

        const studentData = {
            uid: userRecord.uid,
            email,
            fullName,
            loginId,
            role: 'user',
            isBlocked: false,
            enrolledCourses: [],
            createdAt: new Date(),
            authProvider: 'email',
        };

        // Save to Firestore
        await (adminDb as any).collection('users').doc(userRecord.uid).set(studentData);

        return NextResponse.json(
            {
                success: true,
                message: 'Registration successful',
                loginId: loginId,
                student: {
                    email,
                    fullName,
                    loginId
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('❌ Student registration error:', error);
        return NextResponse.json(
            { error: error.message || 'Registration failed' },
            { status: 500 }
        );
    }
}
