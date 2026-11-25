import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

async function uploadDayTaskImageToFirebaseStorage(
  courseId: string,
  dayId: string,
  taskImageInput?: string | null
): Promise<string | undefined> {
  if (taskImageInput === undefined) return undefined;
  if (taskImageInput === null || taskImageInput === '') return '';
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
      const fileName = `courses/${courseId}/days/tasks/${dayId}_${Date.now()}_day_task.${ext}`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType,
        },
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log('✅ Updated day task image uploaded to Firebase Storage:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('❌ Error uploading updated day task image:', err);
      return undefined;
    }
  }
  return undefined;
}

export async function PUT(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const body = await request.json();
    const {
      courseId,
      dayId,
      title,
      order,
      taskTitle,
      taskDescription,
      taskType,
      taskImage,
      taskImageUrl,
    } = body;

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

    const rawTaskImage = taskImage !== undefined ? taskImage : taskImageUrl;
    const resolvedTaskImageUrl = await uploadDayTaskImageToFirebaseStorage(
      courseId,
      dayId,
      rawTaskImage
    );

    if (taskTitle !== undefined) updateData.taskTitle = String(taskTitle).trim();
    if (taskDescription !== undefined) updateData.taskDescription = String(taskDescription).trim();
    if (taskType !== undefined) updateData.taskType = String(taskType).trim() || 'speaking_recording';
    if (resolvedTaskImageUrl !== undefined) updateData.taskImageUrl = resolvedTaskImageUrl;

    if (
      taskTitle !== undefined ||
      taskDescription !== undefined ||
      taskType !== undefined ||
      resolvedTaskImageUrl !== undefined
    ) {
      const existingDayDoc = await (adminDb as any)
        .collection('courses')
        .doc(courseId)
        .collection('days')
        .doc(dayId)
        .get();
      const existingData = existingDayDoc.exists ? existingDayDoc.data() : {};

      const mergedTitle =
        updateData.taskTitle !== undefined ? updateData.taskTitle : existingData.taskTitle || '';
      const mergedDesc =
        updateData.taskDescription !== undefined
          ? updateData.taskDescription
          : existingData.taskDescription || '';
      const mergedType =
        updateData.taskType !== undefined
          ? updateData.taskType
          : existingData.taskType || 'speaking_recording';
      const mergedImage =
        updateData.taskImageUrl !== undefined
          ? updateData.taskImageUrl
          : existingData.taskImageUrl || '';

      const hasTask = Boolean(mergedTitle || mergedDesc || mergedImage);
      updateData.task = hasTask
        ? {
            title: mergedTitle,
            description: mergedDesc,
            type: mergedType,
            imageUrl: mergedImage,
          }
        : null;
    }

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
