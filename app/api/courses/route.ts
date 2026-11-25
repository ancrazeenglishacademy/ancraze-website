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
    console.warn("⚠️ [API /api/courses] No INTERNAL_API_KEY set in environment variables");
    return true; 
  }
  return apiKey === validApiKey;
};

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    console.error("❌ [POST /api/courses] 401 Unauthorized: Missing or invalid x-api-key header");
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing API key",
        message: "Please provide a valid 'x-api-key' request header.",
      },
      { status: 401 }
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    console.warn(`⚠️ [POST /api/courses] 429 Too Many Requests from IP: ${ip}`);
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests",
        message: "Rate limit exceeded (max 100 requests per minute). Please try again shortly.",
      },
      { status: 429 }
    );
  }

  try {
    if (!adminDb || !adminStorage) {
      console.error("❌ [POST /api/courses] 503 Service Unavailable: Firebase Admin SDK (Firestore/Storage) is not initialized");
      return NextResponse.json(
        {
          success: false,
          error: "Database or storage service unavailable",
          message: "Firebase Admin SDK is not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local.",
        },
        { status: 503 }
      );
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

    // Homepage & Courses Page Card/Modal Specific Fields
    const badge = ((formData.get('badge') as string) || '').trim();
    const tagline = ((formData.get('tagline') as string) || '').trim();
    const duration = ((formData.get('duration') as string) || '').trim();
    const validity = ((formData.get('validity') as string) || '').trim();
    const liveSessions = ((formData.get('liveSessions') as string) || '').trim();
    const whoShouldJoin = ((formData.get('whoShouldJoin') as string) || '').trim();

    const featuresRaw = (formData.get('features') as string) || '';
    let features: string[] = [];
    if (featuresRaw.trim()) {
      try {
        const parsed = JSON.parse(featuresRaw);
        if (Array.isArray(parsed)) features = parsed;
      } catch {
        features = featuresRaw
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean);
      }
    }

    const experienceRaw = (formData.get('experience') as string) || '';
    let experience: Array<{ title: string; desc: string }> = [];
    if (experienceRaw.trim()) {
      try {
        const parsedExp = JSON.parse(experienceRaw);
        if (Array.isArray(parsedExp)) experience = parsedExp;
      } catch {
        experience = experienceRaw
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [t, ...rest] = line.split(':');
            return {
              title: t.trim(),
              desc: rest.join(':').trim() || t.trim(),
            };
          });
      }
    }

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
      badge,
      tagline,
      duration,
      validity,
      liveSessions,
      features,
      whoShouldJoin,
      experience,
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
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [POST /api/courses] 500 Internal Server Error: ${errMsg}`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create course',
        message: `An unexpected error occurred while creating the course: ${errMsg}`,
        details: errMsg,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const courseId = searchParams.get('courseId');
  const showOnHomePageOnly =
    searchParams.get('showOnHomePage') === 'true' ||
    searchParams.get('homeOnly') === 'true' ||
    searchParams.get('public') === 'true';
  const hasValidApiKey = checkApiKey(request);

  // Access Control:
  // Requesting specific course details (courseId) or full internal course list requires a valid x-api-key.
  // Public catalog requests for courses marked "Show on Home Page" (used by / and /courses) are allowed publicly
  // and only return public showcase metadata (no unlocked curriculum video streams).
  if (courseId && !hasValidApiKey) {
    console.error(`❌ [GET /api/courses] 401 Unauthorized: Access control blocked course detail request without valid x-api-key (${request.nextUrl.pathname}${request.nextUrl.search})`);
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Access denied for course details",
        message: "Access control requires a valid 'x-api-key' header when requesting course details.",
      },
      { status: 401 }
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    console.warn(`⚠️ [GET /api/courses] 429 Too Many Requests from IP: ${ip}`);
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests",
        message: "Rate limit exceeded (max 100 requests per minute). Please try again shortly.",
      },
      { status: 429 }
    );
  }

  try {
    if (!adminDb) {
      console.error("❌ [GET /api/courses] 503 Service Unavailable: Firebase Admin Firestore is not initialized");
      return NextResponse.json(
        {
          success: false,
          error: "Database service unavailable",
          message: "Firebase Admin SDK is not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local.",
        },
        { status: 503 }
      );
    }

    // Check for single course fetch
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

    // List Courses view
    const snapshot = await (adminDb as any).collection('courses').orderBy('createdAt', 'desc').get();

    // If requested for public /courses or homepage (or without internal API key),
    // filter to courses with showOnHomePage !== false and return public showcase details & features
    // without exposing internal curriculum video stream URLs.
    const isPublicShowcaseRequest = showOnHomePageOnly || !hasValidApiKey;

    if (isPublicShowcaseRequest) {
      const publicCourses = (snapshot as any).docs
        .map((doc: any) => {
          const data = doc.data();
          const normalizedFeatures = Array.isArray(data.features)
            ? data.features
            : typeof data.features === 'string' && data.features.trim()
            ? data.features.split('\n').map((f: string) => f.trim()).filter(Boolean)
            : Array.isArray(data.lessons) && data.lessons.length > 0
            ? data.lessons.map((l: any) => (typeof l === 'string' ? l : l.title || 'Interactive lesson'))
            : [];

          return {
            id: doc.id,
            title: data.title || data.name || 'Spoken English Course',
            name: data.title || data.name || 'Spoken English Course',
            description: data.description || data.overview || '',
            overview: data.description || data.overview || '',
            teacherName: data.teacherName || 'Ancraze Spoken English Academy',
            price: data.price,
            coverImage: data.coverImage || data.coverImageUrl || data.imageUrl || '',
            showOnHomePage: data.showOnHomePage !== false,
            isTrainerGuided: Boolean(data.isTrainerGuided),
            refundDays: typeof data.refundDays === 'number' ? data.refundDays : 0,
            badge: data.badge || '',
            tagline: data.tagline || '',
            duration: data.duration || '',
            validity: data.validity || '',
            liveSessions: data.liveSessions || '',
            features: normalizedFeatures,
            whoShouldJoin: data.whoShouldJoin || '',
            experience: Array.isArray(data.experience) ? data.experience : [],
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        })
        .filter((course: any) => course.showOnHomePage !== false);

      return NextResponse.json(
        {
          success: true,
          courses: publicCourses,
          total: publicCourses.length,
        },
        { status: 200 }
      );
    }

    const courses = await Promise.all((snapshot as any).docs.map(async (doc: any) => {
      const courseData = doc.data();
      // Fetch days for this course
      const daysSnapshot = await (adminDb as any).collection('courses').doc(doc.id).collection('days').orderBy('order', 'asc').get();
      const rawDays = daysSnapshot.docs.map((dDoc: any) => ({
        id: dDoc.id,
        ...dDoc.data(),
        modules: [] as any[],
        createdAt: dDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      const modulesSnapshot = await (adminDb as any).collection('courses').doc(doc.id).collection('modules').orderBy('createdAt', 'asc').get();
      const rawModules = (modulesSnapshot as any).docs.map((mDoc: any) => ({
        id: mDoc.id,
        ...mDoc.data(),
        createdAt: mDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      rawModules.forEach((module: any) => {
        const dayIndex = rawDays.findIndex((d: any) => d.id === module.day);
        if (dayIndex !== -1) {
          rawDays[dayIndex].modules.push(module);
        }
      });

      const isCoursePurchased = userEnrolledCourses.includes(doc.id);
      const lockedResult = computeCourseAccessAndLocking({
        courseId: doc.id,
        courseData,
        days: rawDays,
        modules: rawModules,
        userData: matchedUserData,
        isPurchased: isCoursePurchased,
        isAdminOrTrainer,
        approvedTasksCount: 0,
      });

      // Fetch enrolled count
      const studentsSnapshot = await (adminDb as any).collection('users').where('role', '==', 'student').where('enrolledCourses', 'array-contains', doc.id).count().get();
      const studentCount = studentsSnapshot.data().count;

      return {
        id: doc.id,
        ...courseData,
        days: lockedResult.days,
        accessControl: lockedResult.accessControl,
        moduleCount: rawModules.length,
        studentCount,
        createdAt: courseData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: courseData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
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
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [GET /api/courses] 500 Internal Server Error: ${errMsg}`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses',
        message: `An unexpected error occurred while fetching courses: ${errMsg}`,
        details: errMsg,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkApiKey(request)) {
    console.error("❌ [DELETE /api/courses] 401 Unauthorized: Missing or invalid x-api-key header");
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing API key",
        message: "Please provide a valid 'x-api-key' request header.",
      },
      { status: 401 }
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    console.warn(`⚠️ [DELETE /api/courses] 429 Too Many Requests from IP: ${ip}`);
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests",
        message: "Rate limit exceeded (max 100 requests per minute). Please try again shortly.",
      },
      { status: 429 }
    );
  }

  try {
    if (!adminDb) {
      console.error("❌ [DELETE /api/courses] 503 Service Unavailable: Firebase Admin Firestore is not initialized");
      return NextResponse.json(
        {
          success: false,
          error: "Database service unavailable",
          message: "Firebase Admin SDK is not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local.",
        },
        { status: 503 }
      );
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
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [DELETE /api/courses] 500 Internal Server Error: ${errMsg}`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete course',
        message: `An unexpected error occurred while deleting the course: ${errMsg}`,
        details: errMsg,
      },
      { status: 500 }
    );
  }
}
