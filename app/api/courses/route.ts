import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
export const dynamic = 'force-dynamic';
import * as admin from 'firebase-admin';
import { formatModuleForStreaming, computeCourseAccessAndLocking } from '@/lib/mux';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const userData = rateLimitMap.get(ip);
  if (!userData) {
    rateLimitMap.set(ip, { count: 1, lastRequest: now });
    return true;
  }
  if (now - userData.lastRequest > RATE_LIMIT_WINDOW) {
    userData.count = 1;
    userData.lastRequest = now;
    return true;
  }
  if (userData.count >= MAX_REQUESTS) return false;
  userData.count += 1;
  return true;
};

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey = process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;
  if (!validApiKey) {
    console.warn("⚠️ NO INTERNAL_API_KEY set");
    return true; 
  }
  return apiKey === validApiKey;
};

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    if (!adminDb || !adminStorage) {
      throw new Error('Firebase Admin services not available');
    }

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const teacherName = formData.get('teacherName') as string;
    const price = parseFloat(formData.get('price') as string);
    const coverImage = formData.get('coverImage') as File;
    const showOnHomePageStr = formData.get('showOnHomePage');
    const showOnHomePage = showOnHomePageStr === null ? true : (showOnHomePageStr === 'true' || showOnHomePageStr === 'on' || showOnHomePageStr === '1');
    const isTrainerGuidedStr = formData.get('isTrainerGuided');
    const isTrainerGuided = isTrainerGuidedStr === 'true' || isTrainerGuidedStr === 'on' || isTrainerGuidedStr === '1';
    const refundDaysRaw = formData.get('refundDays') as string;
    const parsedRefundDays = refundDaysRaw !== null && refundDaysRaw !== '' ? parseInt(refundDaysRaw, 10) : 0;
    const refundDays = isNaN(parsedRefundDays) || parsedRefundDays < 0 ? 0 : parsedRefundDays;

    // Validate required fields
    if (!title || !description || !teacherName || !price || !coverImage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let imageUrl = '';

    // Upload image to Firebase Storage
    try {
      const bucket = (adminStorage as any).bucket();
      const fileName = `courses/${Date.now()}_${coverImage.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const file = bucket.file(fileName);

      const buffer = await coverImage.arrayBuffer();
      await file.save(Buffer.from(buffer), {
        metadata: {
          contentType: coverImage.type,
        },
      });

      // Make file public and get download URL
      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      console.log('✅ Image uploaded successfully:', imageUrl);
    } catch (storageError) {
      console.error('❌ Storage upload error:', storageError);
      // Continue without image URL if upload fails
    }

    // Add course to Firestore using Admin SDK
    const courseData = {
      title,
      description,
      teacherName,
      price: parseFloat(price.toString()),
      coverImage: imageUrl,
      showOnHomePage: showOnHomePage,
      isTrainerGuided: isTrainerGuided,
      refundDays: refundDays,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await (adminDb as any).collection('courses').add(courseData);

    console.log('✅ Course created successfully with ID:', docRef.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Course created successfully',
        courseId: docRef.id,
        course: courseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating course:', error);
    return NextResponse.json(
      {
        error: 'Failed to create course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    // Check for single course fetch
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const email = searchParams.get('email');
    const loginId = searchParams.get('loginId');
    const deviceId = searchParams.get('deviceId');

    let currentUserId = "";
    let userEnrolledCourses: string[] = [];

    // Security Check: If email is provided, verify credentials
    if (email) {
      if (!loginId) {
        return NextResponse.json(
          { error: 'Login ID is required when email is provided' },
          { status: 400 }
        );
      }

      // Verify student credentials in Firestore
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
      currentUserId = userSnapshot.docs[0].id;
      userEnrolledCourses = userData.enrolledCourses || [];
    }

    let hasPurchased = false;
    let matchedUserData: any = null;
    let isAdminOrTrainer = false;
    if (courseId) {
      const pUserId = searchParams.get('userId') || searchParams.get('stdId');
      
      const checkEnrolled = (uData: any) => {
        if (
          uData.role === 'admin' ||
          uData.role === 'superadmin' ||
          uData.role === 'trainer' ||
          uData.isTrainerPreviewAccount === true ||
          uData.trainerPreviewAccount === true
        ) {
          isAdminOrTrainer = true;
          return true;
        }
        return uData.enrolledCourses && uData.enrolledCourses.includes(courseId);
      };

      if (email) {
        const userSnapshot = await (adminDb as any).collection('users').where('email', '==', email).limit(1).get();
        if (!userSnapshot.empty) {
          const uData = userSnapshot.docs[0].data();
          matchedUserData = uData;
          currentUserId = userSnapshot.docs[0].id;
          if (checkEnrolled(uData)) hasPurchased = true;
        }
      } else if (pUserId) {
          let userDoc = await (adminDb as any).collection('users').doc(pUserId).get();
          let uData = userDoc.exists ? userDoc.data() : null;
          if (userDoc.exists) currentUserId = userDoc.id;

          if (!uData) {
            const userIdQuery = await (adminDb as any).collection('users').where('userId', '==', pUserId).limit(1).get();
            if (!userIdQuery.empty) {
              uData = userIdQuery.docs[0].data();
              currentUserId = userIdQuery.docs[0].id;
            } else {
              const uidQuery = await (adminDb as any).collection('users').where('uid', '==', pUserId).limit(1).get();
              if (!uidQuery.empty) {
                uData = uidQuery.docs[0].data();
                currentUserId = uidQuery.docs[0].id;
              }
            }
          }

          if (uData) {
            matchedUserData = uData;
            if (checkEnrolled(uData)) {
              hasPurchased = true;
            }
          }
      }
    }

    if (courseId) {
      const doc = await (adminDb as any).collection('courses').doc(courseId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      const courseData = doc.data();

      // Fetch days for this course
      const daysSnapshot = await (adminDb as any)
        .collection('courses')
        .doc(courseId)
        .collection('days')
        .orderBy('order', 'asc')
        .get();

      const rawDays = daysSnapshot.docs.map((dDoc: any) => ({
        id: dDoc.id,
        ...dDoc.data(),
        modules: [] as any[],
        createdAt: dDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      // Fetch modules for this specific course
      const modulesSnapshot = await (adminDb as any)
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .orderBy('createdAt', 'asc')
        .get();

      const rawModules = (modulesSnapshot as any).docs.map((mDoc: any) => ({
        id: mDoc.id,
        ...mDoc.data(),
        createdAt: mDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      // Nest raw modules inside their respective days
      rawModules.forEach((module: any) => {
        const dayIndex = rawDays.findIndex((d: any) => d.id === module.day);
        if (dayIndex !== -1) {
          rawDays[dayIndex].modules.push(module);
        }
      });

      // Count approved/completed tasks for this student if trainer-guided
      let approvedTasksCount = 0;
      if (hasPurchased && courseData?.isTrainerGuided && currentUserId) {
        try {
          const tasksSnap = await (adminDb as any)
            .collection('tasks')
            .where('studentId', '==', currentUserId)
            .get();
          approvedTasksCount = tasksSnap.docs.filter((tDoc: any) => {
            const t = tDoc.data();
            const isDone = t.status === 'approved' || t.status === 'completed';
            const matchesCourse = !t.courseId || t.courseId === courseId;
            return isDone && matchesCourse;
          }).length;
        } catch (tErr) {
          console.warn('Could not query student tasks for unlocking:', tErr);
        }
      }

      const lockedResult = computeCourseAccessAndLocking({
        courseId,
        courseData,
        days: rawDays,
        modules: rawModules,
        userData: matchedUserData,
        isPurchased: hasPurchased,
        isAdminOrTrainer,
        approvedTasksCount,
      });

      return NextResponse.json({
        success: true,
        isPurchased: hasPurchased,
        accessControl: lockedResult.accessControl,
        course: {
          id: doc.id,
          ...courseData,
          days: lockedResult.days,
          modules: lockedResult.modules,
          accessControl: lockedResult.accessControl,
          createdAt: courseData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      }, { status: 200 });
    }

    // List All Courses view
    const snapshot = await (adminDb as any).collection('courses').orderBy('createdAt', 'desc').get();

    const courses = await Promise.all((snapshot as any).docs.map(async (doc: any) => {
      // Fetch days for this course
      const daysSnapshot = await (adminDb as any).collection('courses').doc(doc.id).collection('days').orderBy('order', 'asc').get();
      const days = daysSnapshot.docs.map((dDoc: any) => ({
        id: dDoc.id,
        ...dDoc.data(),
        modules: [] as any[],
        createdAt: dDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      const modulesSnapshot = await (adminDb as any).collection('courses').doc(doc.id).collection('modules').orderBy('createdAt', 'asc').get();
      const modules = (modulesSnapshot as any).docs.map((mDoc: any) => ({
        id: mDoc.id,
        ...mDoc.data(),
        createdAt: mDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      modules.forEach((module: any) => {
        const dayIndex = days.findIndex((d: any) => d.id === module.day);
        if (dayIndex !== -1) {
          days[dayIndex].modules.push(formatModuleForStreaming(module, false));
        }
      });

      // Fetch enrolled count
      const studentsSnapshot = await (adminDb as any).collection('users').where('role', '==', 'student').where('enrolledCourses', 'array-contains', doc.id).count().get();
      const studentCount = studentsSnapshot.data().count;

      return {
        id: doc.id,
        ...doc.data(),
        days,
        moduleCount: modules.length,
        studentCount,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }));

    return NextResponse.json(
      {
        success: true,
        courses,
        total: courses.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing courseId parameter' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting course: ${courseId}`);

    // Delete the course document
    await (adminDb as any).collection('courses').doc(courseId).delete();

    console.log('✅ Course deleted successfully');

    return NextResponse.json(
      { success: true, message: 'Course deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
