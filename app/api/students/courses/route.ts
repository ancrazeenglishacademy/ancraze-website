import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        if (!adminDb) {
            throw new Error('Firebase Admin services not available');
        }

        const searchParams = request.nextUrl.searchParams;
        const email = searchParams.get('email');
        const loginId = searchParams.get('loginId');
        const deviceId = searchParams.get('deviceId');
        const courseId = searchParams.get('courseId'); // Optional: for specific course access

        if (!email || !loginId || !deviceId) {
            return NextResponse.json(
                { error: 'Email, Login ID, and Device ID are required' },
                { status: 400 }
            );
        }

        // 1. Verify student credentials and deviceId in Firestore
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

        const userData = userSnapshot.docs[0].data();

        // Security Check: Device Verification
        if (userData.deviceId && userData.deviceId !== deviceId) {
            return NextResponse.json(
                { error: 'Access denied: Your already login in another device' },
                { status: 403 }
            );
        }

        const enrolledCourseIds = userData.enrolledCourses || [];

        // If courseId is provided, fetch only that specific course
        if (courseId) {
            // Check if student is enrolled in this course
            if (!enrolledCourseIds.includes(courseId)) {
                return NextResponse.json(
                    { error: 'Access denied: You are not enrolled in this course' },
                    { status: 403 }
                );
            }

            // Fetch the specific course
            const courseDoc = await (adminDb as any).collection('courses').doc(courseId).get();

            if (!courseDoc.exists) {
                return NextResponse.json(
                    { error: 'Course not found' },
                    { status: 404 }
                );
            }

            const courseData = courseDoc.data();

            // Fetch modules for this course
            const modulesSnapshot = await (adminDb as any)
                .collection('courses')
                .doc(courseId)
                .collection('modules')
                .orderBy('createdAt', 'asc')
                .get();

            const modules = (modulesSnapshot as any).docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));

            const course = {
                id: courseId,
                ...courseData,
                modules,
                createdAt: courseData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: courseData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };

            return NextResponse.json(
                {
                    success: true,
                    course,
                },
                { status: 200 }
            );
        }

        // If no courseId, fetch all enrolled courses (existing behavior)
        const coursesData = await Promise.all(
            enrolledCourseIds.map(async (cId: string) => {
                const courseDoc = await (adminDb as any).collection('courses').doc(cId).get();
                if (!courseDoc.exists) return null;

                const courseData = courseDoc.data();

                // Fetch modules for this course
                const modulesSnapshot = await (adminDb as any)
                    .collection('courses')
                    .doc(cId)
                    .collection('modules')
                    .orderBy('createdAt', 'asc')
                    .get();

                const modules = (modulesSnapshot as any).docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                }));

                return {
                    id: cId,
                    ...courseData,
                    modules,
                    createdAt: courseData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    updatedAt: courseData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                };
            })
        );

        // Filter out any nulls if course was deleted
        const activeCourses = coursesData.filter(Boolean);

        return NextResponse.json(
            {
                success: true,
                courses: activeCourses,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('❌ Error fetching student courses:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch enrolled courses',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
