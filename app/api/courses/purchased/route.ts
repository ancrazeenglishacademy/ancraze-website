import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Provide userId or email to fetch purchased courses' },
        { status: 400 }
      );
    }

    let uData: any = null;
    let enrolledCourseIds: string[] = [];

    // Identify user and get enrolled courses
    if (userId) {
       const userDoc = await (adminDb as any).collection('users').doc(userId).get();
       if (userDoc.exists) {
         uData = userDoc.data();
       } else {
         // Try searching by userId field
         const q = await (adminDb as any).collection('users').where('userId', '==', userId).limit(1).get();
         if (!q.empty) uData = q.docs[0].data();
       }
    } else if (email) {
       const q = await (adminDb as any).collection('users').where('email', '==', email).limit(1).get();
       if (!q.empty) uData = q.docs[0].data();
    }

    if (!uData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    enrolledCourseIds = uData.enrolledCourses || [];

    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({
        success: true,
        courses: [],
        message: 'No purchased courses found'
      }, { status: 200 });
    }

    // Fetch only the flat course objects
    const coursesSnapshot = await (adminDb as any)
      .collection('courses')
      .where(admin.firestore.FieldPath.documentId(), 'in', enrolledCourseIds.slice(0, 30))
      .get();

    const courses = coursesSnapshot.docs.map((doc: any) => {
      const courseData = doc.data();
      return {
        id: doc.id,
        ...courseData,
        isPurchased: true,
        createdAt: courseData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: courseData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      courses,
      total: courses.length
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching purchased courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchased courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
