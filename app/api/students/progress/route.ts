import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey =
    process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;
  if (!validApiKey) {
    console.warn('⚠️ NO INTERNAL_API_KEY set');
    return true;
  }
  return apiKey === validApiKey;
};

const toIsoString = (val: any): string | null => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val?.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  if (typeof val?._seconds === 'number') {
    return new Date(val._seconds * 1000).toISOString();
  }
  return null;
};

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId =
      searchParams.get('studentId') ||
      searchParams.get('userId') ||
      searchParams.get('stdId');
    const courseId = searchParams.get('courseId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 }
      );
    }

    const userRef = (adminDb as any).collection('users').doc(studentId);

    if (courseId) {
      const progressRef = userRef.collection('courseProgress').doc(courseId);
      const [progressDoc, userDoc] = await Promise.all([
        progressRef.get(),
        userRef.get(),
      ]);

      const userData = userDoc.exists ? userDoc.data() : null;
      const pData = progressDoc.exists
        ? progressDoc.data()
        : userData?.courseProgress?.[courseId] || null;

      const enrollmentStart =
        userData?.courseEnrollments?.[courseId]?.startedAt ||
        userData?.courseEnrollments?.[courseId]?.enrolledAt ||
        null;

      const startedAt = toIsoString(pData?.startedAt || enrollmentStart);
      const watchedModuleIds: string[] = Array.isArray(pData?.watchedModuleIds)
        ? pData.watchedModuleIds
        : [];
      const updatedAt = toIsoString(pData?.updatedAt);

      return NextResponse.json(
        {
          success: true,
          studentId,
          courseId,
          startedAt,
          watchedModuleIds,
          updatedAt,
          progress: {
            courseId,
            startedAt,
            watchedModuleIds,
            updatedAt,
          },
        },
        { status: 200 }
      );
    }

    // Fetch all course progress documents for the student
    const [progressSnap, userDoc] = await Promise.all([
      userRef.collection('courseProgress').get(),
      userRef.get(),
    ]);

    const userData = userDoc.exists ? userDoc.data() : null;
    const progressMap: Record<
      string,
      {
        courseId: string;
        startedAt: string | null;
        watchedModuleIds: string[];
        updatedAt: string | null;
      }
    > = {};

    // Populate from user document fallback map if present
    if (userData?.courseProgress && typeof userData.courseProgress === 'object') {
      for (const [cId, entry] of Object.entries<any>(userData.courseProgress)) {
        progressMap[cId] = {
          courseId: cId,
          startedAt: toIsoString(
            entry?.startedAt ||
              userData?.courseEnrollments?.[cId]?.startedAt ||
              userData?.courseEnrollments?.[cId]?.enrolledAt
          ),
          watchedModuleIds: Array.isArray(entry?.watchedModuleIds)
            ? entry.watchedModuleIds
            : [],
          updatedAt: toIsoString(entry?.updatedAt),
        };
      }
    }

    // Subcollection docs take precedence
    progressSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      const cId = doc.id;
      progressMap[cId] = {
        courseId: cId,
        startedAt: toIsoString(
          data?.startedAt ||
            userData?.courseEnrollments?.[cId]?.startedAt ||
            userData?.courseEnrollments?.[cId]?.enrolledAt
        ),
        watchedModuleIds: Array.isArray(data?.watchedModuleIds)
          ? data.watchedModuleIds
          : [],
        updatedAt: toIsoString(data?.updatedAt),
      };
    });

    return NextResponse.json(
      {
        success: true,
        studentId,
        progress: progressMap,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching student progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch student progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const body = await request.json();
    const {
      studentId,
      courseId,
      moduleId,
      moduleIds,
      watched = true,
      initializeStartDate = true,
    } = body;

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: 'studentId and courseId are required' },
        { status: 400 }
      );
    }

    const targetModules: string[] = [];
    if (typeof moduleId === 'string' && moduleId.trim()) {
      targetModules.push(moduleId.trim());
    }
    if (Array.isArray(moduleIds)) {
      moduleIds.forEach((id) => {
        if (typeof id === 'string' && id.trim() && !targetModules.includes(id.trim())) {
          targetModules.push(id.trim());
        }
      });
    }

    const userRef = (adminDb as any).collection('users').doc(studentId);
    const progressRef = userRef.collection('courseProgress').doc(courseId);

    const result = await (adminDb as any).runTransaction(async (tx: any) => {
      const [progressDoc, userDoc] = await Promise.all([
        tx.get(progressRef),
        tx.get(userRef),
      ]);

      const existingData = progressDoc.exists ? progressDoc.data() : {};
      const userData = userDoc.exists ? userDoc.data() : {};

      const existingWatched: string[] = Array.isArray(existingData?.watchedModuleIds)
        ? existingData.watchedModuleIds
        : [];

      let nextWatchedSet = new Set(existingWatched);
      if (targetModules.length > 0) {
        if (watched !== false) {
          targetModules.forEach((m) => nextWatchedSet.add(m));
        } else {
          targetModules.forEach((m) => nextWatchedSet.delete(m));
        }
      }
      const nextWatchedModuleIds = Array.from(nextWatchedSet);

      let startedAtValue = existingData?.startedAt || null;
      if (!startedAtValue && initializeStartDate !== false) {
        startedAtValue =
          userData?.courseEnrollments?.[courseId]?.startedAt ||
          userData?.courseEnrollments?.[courseId]?.enrolledAt ||
          admin.firestore.FieldValue.serverTimestamp();
      }

      const updatePayload: Record<string, any> = {
        courseId,
        studentId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (startedAtValue) {
        updatePayload.startedAt = startedAtValue;
      }

      if (targetModules.length > 0) {
        updatePayload.watchedModuleIds =
          watched !== false
            ? admin.firestore.FieldValue.arrayUnion(...targetModules)
            : admin.firestore.FieldValue.arrayRemove(...targetModules);
      } else if (!progressDoc.exists) {
        updatePayload.watchedModuleIds = [];
      }

      tx.set(progressRef, updatePayload, { merge: true });

      const resolvedStartIso =
        toIsoString(existingData?.startedAt) ||
        toIsoString(userData?.courseEnrollments?.[courseId]?.startedAt) ||
        toIsoString(userData?.courseEnrollments?.[courseId]?.enrolledAt) ||
        new Date().toISOString();

      return {
        startedAt: resolvedStartIso,
        watchedModuleIds: nextWatchedModuleIds,
      };
    });

    return NextResponse.json(
      {
        success: true,
        studentId,
        courseId,
        startedAt: result.startedAt,
        watchedModuleIds: result.watchedModuleIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating student progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to update student progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
