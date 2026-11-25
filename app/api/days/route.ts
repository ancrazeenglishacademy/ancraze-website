import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

async function uploadDayTaskImageToFirebaseStorage(
  courseId: string,
  taskImageInput?: string | null
): Promise<string> {
  if (!taskImageInput) return '';
  if (taskImageInput.startsWith('http://') || taskImageInput.startsWith('https://')) {
    return taskImageInput;
  }
  if (taskImageInput.startsWith('data:image/') && adminStorage) {
    try {
      const mimeMatch = taskImageInput.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const base64Data = taskImageInput.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const bucket = (adminStorage as any).bucket();
      const fileName = `courses/${courseId}/days/tasks/${Date.now()}_day_task.${ext}`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType,
        },
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log('✅ Day task image uploaded to Firebase Storage:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('❌ Error uploading day task image to Firebase Storage:', err);
      return '';
    }
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const body = await request.json();
    const {
      courseId,
      title,
      order,
      taskTitle = '',
      taskDescription = '',
      taskType = 'speaking_recording',
      taskImage,
      taskImageUrl,
    } = body;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'Missing courseId or title' },
        { status: 400 }
      );
    }

    const rawTaskImage = taskImage !== undefined ? taskImage : taskImageUrl;
    const finalTaskImageUrl = await uploadDayTaskImageToFirebaseStorage(courseId, rawTaskImage);
    const cleanTaskTitle = String(taskTitle || '').trim();
    const cleanTaskDescription = String(taskDescription || '').trim();
    const cleanTaskType = String(taskType || 'speaking_recording').trim();
    const hasTask = Boolean(cleanTaskTitle || cleanTaskDescription || finalTaskImageUrl);

    const dayData = {
      courseId,
      title,
      order: order !== undefined ? order : 0,
      taskTitle: cleanTaskTitle,
      taskDescription: cleanTaskDescription,
      taskType: cleanTaskType,
      taskImageUrl: finalTaskImageUrl,
      task: hasTask
        ? {
            title: cleanTaskTitle,
            description: cleanTaskDescription,
            type: cleanTaskType,
            imageUrl: finalTaskImageUrl,
          }
        : null,
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
