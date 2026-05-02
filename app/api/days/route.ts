import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const body = await request.json();
    const { courseId, title, order } = body;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'Missing courseId or title' },
        { status: 400 }
      );
    }

    const dayData = {
      courseId,
      title,
      order: order !== undefined ? order : 0,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await (adminDb as any)
      .collection('courses')
      .doc(courseId)
      .collection('days')
      .add(dayData);

    return NextResponse.json(
      {
        success: true,
        message: 'Day created successfully',
        dayId: docRef.id,
        day: dayData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating day:', error);
    return NextResponse.json(
      {
        error: 'Failed to create day',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const snapshot = await (adminDb as any)
      .collection('courses')
      .doc(courseId)
      .collection('days')
      .orderBy('order', 'asc')
      .get();

    const days = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        days,
        total: days.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching days:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch days',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const dayId = searchParams.get('dayId');

    if (!courseId || !dayId) {
      return NextResponse.json(
        { error: 'Missing courseId or dayId' },
        { status: 400 }
      );
    }

    // Delete the day
    await (adminDb as any)
      .collection('courses')
      .doc(courseId)
      .collection('days')
      .doc(dayId)
      .delete();

    // Optionally: could delete all modules for this day here

    return NextResponse.json(
      { success: true, message: 'Day deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting day:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete day',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
