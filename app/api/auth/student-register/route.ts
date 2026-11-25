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

        const normalizedEmail = String(email).trim();

        // Check if user already exists in Auth or Firestore.
        // If the user's account was previously permanently deleted from Firestore (or marked closed)
        // while an orphaned record remained in Firebase Auth, remove the stale Auth record so they can re-register.
        let existingAuthUser: any = null;
        try {
            existingAuthUser = await (adminAuth as any).getUserByEmail(normalizedEmail);
        } catch (err: any) {
            if (err.code !== 'auth/user-not-found') throw err;
        }

        const existingFirestoreSnap = await (adminDb as any)
            .collection('users')
            .where('email', '==', normalizedEmail)
            .get();

        let hasActiveFirestoreUser = false;
        const staleDocs: any[] = [];

        if (existingAuthUser?.uid) {
            const uidDoc = await (adminDb as any).collection('users').doc(existingAuthUser.uid).get();
            if (uidDoc.exists) {
                const uData = uidDoc.data() || {};
                if (uData.accountStatus !== 'closed' && uData.isDeleted !== true) {
                    hasActiveFirestoreUser = true;
                } else {
                    staleDocs.push(uidDoc);
                }
            }
        }

        existingFirestoreSnap.docs.forEach((doc: any) => {
            const uData = doc.data() || {};
            if (uData.accountStatus !== 'closed' && uData.isDeleted !== true) {
                hasActiveFirestoreUser = true;
            } else {
                staleDocs.push(doc);
            }
        });

        if (hasActiveFirestoreUser) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            );
        }

        if (existingAuthUser?.uid) {
            try {
                await (adminAuth as any).deleteUser(existingAuthUser.uid);
            } catch (cleanupErr) {
                console.warn('Could not clean up orphaned Auth account on student-register:', cleanupErr);
            }
        }

        if (staleDocs.length > 0) {
            await Promise.all(staleDocs.map((d) => d.ref.delete().catch(() => {})));
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
