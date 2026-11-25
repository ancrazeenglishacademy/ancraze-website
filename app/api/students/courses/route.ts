import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { computeCourseAccessAndLocking } from '@/lib/mux';

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
        const studentDocId = userSnapshot.docs[0].id;
        const isAdminOrTrainer =
            userData.role === 'admin' ||
            userData.role === 'superadmin' ||
            userData.role === 'trainer' ||
            userData.isTrainerPreviewAccount === true ||
            userData.trainerPreviewAccount === true;

        // Security Check: Device Verification
        if (userData.deviceId && userData.deviceId !== deviceId) {
            return NextResponse.json(
                { error: 'Access denied: Your already login in another device' },
                { status: 403 }
            );
        }

        const enrolledCourseIds = userData.enrolledCourses || [];

        // Fetch student's approved/completed tasks for trainer-guided course unlocking
        let studentTasks: any[] = [];
        try {
            const tasksSnap = await (adminDb as any)
                .collection('tasks')
                .where('studentId', '==', studentDocId)
                .get();
            studentTasks = tasksSnap.docs.map((tDoc: any) => tDoc.data());
        } catch (tErr) {
            console.warn('Could not fetch tasks for student courses:', tErr);
        }

        const buildCourseWithAccess = async (cId: string) => {
            const courseDoc = await (adminDb as any).collection('courses').doc(cId).get();
            if (!courseDoc.exists) return null;

            const courseData = courseDoc.data();

            const daysSnapshot = await (adminDb as any)
                .collection('courses')
                .doc(cId)
                .collection('days')
                .orderBy('order', 'asc')
                .get();

            const rawDays = daysSnapshot.docs.map((dDoc: any) => ({
                id: dDoc.id,
                ...dDoc.data(),
                modules: [] as any[],
                createdAt: dDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));

            const modulesSnapshot = await (adminDb as any)
                .collection('courses')
                .doc(cId)
                .collection('modules')
                .orderBy('createdAt', 'asc')
                .get();

            const rawModules = (modulesSnapshot as any).docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));

            rawModules.forEach((mod: any) => {
                const dayIdx = rawDays.findIndex((d: any) => d.id === mod.day);
                if (dayIdx !== -1) {
                    rawDays[dayIdx].modules.push(mod);
                }
            });

            const approvedTasksCount = studentTasks.filter((t: any) => {
                const isDone = t.status === 'approved' || t.status === 'completed';
                const matchesCourse = !t.courseId || t.courseId === cId;
                return isDone && matchesCourse;
            }).length;

            const lockedResult = computeCourseAccessAndLocking({
                courseId: cId,
                courseData,
                days: rawDays,
                modules: rawModules,
                userData,
                isPurchased: true,
                isAdminOrTrainer,
                approvedTasksCount,
            });

            return {
                id: cId,
                ...courseData,
                days: lockedResult.days,
                modules: lockedResult.modules,
                accessControl: lockedResult.accessControl,
                createdAt: courseData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: courseData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
        };

        // If courseId is provided, fetch only that specific course
        if (courseId) {
            if (!enrolledCourseIds.includes(courseId) && !isAdminOrTrainer) {
                return NextResponse.json(
                    { error: 'Access denied: You are not enrolled in this course' },
                    { status: 403 }
                );
            }

            const course = await buildCourseWithAccess(courseId);
            if (!course) {
                return NextResponse.json(
                    { error: 'Course not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    course,
                },
                { status: 200 }
            );
        }

        // If no courseId, fetch all enrolled courses
        const coursesData = await Promise.all(
            enrolledCourseIds.map((cId: string) => buildCourseWithAccess(cId))
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
