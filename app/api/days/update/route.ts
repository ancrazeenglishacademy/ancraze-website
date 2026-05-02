import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function PUT(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const body = await request.json();
    const { courseId, dayId, title, order } = body;

    if (!courseId || !dayId) {
      return NextResponse.json(
        { error: 'Missing courseId or dayId' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (title) updateData.title = title;
    if (order !== undefined) updateData.order = order;

    await (adminDb as any)
      .collection('courses')
      .doc(courseId)
      .collection('days')
      .doc(dayId)
      .update(updateData);

    return NextResponse.json(
      {
        success: true,
        message: 'Day updated successfully',
        day: updateData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating day:', error);
    return NextResponse.json(
      {
        error: 'Failed to update day',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
