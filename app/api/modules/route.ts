import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import { formatModuleForStreaming } from '@/lib/mux';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function uploadTaskImageToFirebaseStorage(
  courseId: string,
  taskImageInput?: string | null
): Promise<string> {
  if (!taskImageInput) return '';
  // If already a public URL, return as-is
  if (taskImageInput.startsWith('http://') || taskImageInput.startsWith('https://')) {
    return taskImageInput;
  }
  // If base64 data URL, upload to Firebase Storage
  if (taskImageInput.startsWith('data:image/') && adminStorage) {
    try {
      const mimeMatch = taskImageInput.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const base64Data = taskImageInput.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const bucket = (adminStorage as any).bucket();
      const fileName = `courses/${courseId}/tasks/${Date.now()}_task.${ext}`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType,
        },
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log('✅ Module task image uploaded to Firebase Storage:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('❌ Error uploading task image to Firebase Storage:', err);
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

    console.log('📨 Modules POST request received');
    const contentType = request.headers.get('content-type') || '';
    console.log('📨 Content-Type:', contentType);

    let body: any = {};
    let courseId = '';
    let moduleTitle = '';
    let videoUrl = '';
    let questions: any[] = [];
    let duration = '';
    let day = '';
    let description = '';
    let thumbnailUrl = '';
    let playbackId = '';
    let assetId = '';
    let streamType = 'mux';
    let taskTitle = '';
    let taskDescription = '';
    let taskType = 'speaking_recording';
    let taskImageInput = '';

    try {
      console.log('🔄 Parsing request body...');
      body = await request.json();

      courseId = body.courseId || '';
      moduleTitle = body.moduleTitle || '';
      videoUrl = body.videoUrl || '';
      questions = body.questions || [];
      duration = body.duration || '';
      day = body.day || '';
      description = body.description || '';
      thumbnailUrl = body.thumbnailUrl || '';
      playbackId = body.playbackId || '';
      assetId = body.assetId || '';
      streamType = body.streamType || (playbackId ? 'mux' : 'legacy');
      taskTitle = body.taskTitle ?? body.task?.title ?? '';
      taskDescription = body.taskDescription ?? body.task?.description ?? '';
      taskType = body.taskType ?? body.task?.type ?? 'speaking_recording';
      taskImageInput = body.taskImage ?? body.taskImageUrl ?? body.task?.imageUrl ?? '';

      // Auto-populate Mux streaming URL and thumbnail if playbackId is provided
      if (playbackId) {
        if (!videoUrl) videoUrl = `https://stream.mux.com/${playbackId}.m3u8`;
        if (!thumbnailUrl) thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      }

      console.log('✅ Request parsed successfully');
      console.log('  - courseId:', courseId);
      console.log('  - moduleTitle:', moduleTitle);
      console.log('  - day:', day);
      console.log('  - videoUrl:', videoUrl ? '✓' : '(empty)');
      console.log('  - questions count:', questions.length);
    } catch (parseError) {
      console.error('❌ Failed to parse request:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!courseId || !moduleTitle) {
      console.error('❌ Validation failed - Missing courseId or moduleTitle');
      console.error('  - courseId:', courseId || 'MISSING');
      console.error('  - moduleTitle:', moduleTitle || 'MISSING');
      return NextResponse.json(
        { error: 'Missing required fields: courseId and moduleTitle are required' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, creating module...');

    const finalTaskImageUrl = await uploadTaskImageToFirebaseStorage(courseId, taskImageInput);
    const hasTask = Boolean(taskTitle.trim() || taskDescription.trim() || finalTaskImageUrl);

    // Create module data
    const moduleData = {
      courseId,
      title: moduleTitle,
      videoUrl: videoUrl || 'no video url',
      playbackId: playbackId || '',
      assetId: assetId || '',
      streamType: streamType || 'mux',
      questions: questions || [],
      duration: duration || '',
      day: body.day || '',
      description: description || '',
      thumbnailUrl: thumbnailUrl || '',
      taskTitle: taskTitle.trim(),
      taskDescription: taskDescription.trim(),
      taskType: taskType || 'speaking_recording',
      taskImageUrl: finalTaskImageUrl,
      task: hasTask
        ? {
            title: taskTitle.trim(),
            description: taskDescription.trim(),
            type: taskType || 'speaking_recording',
            imageUrl: finalTaskImageUrl,
          }
        : null,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // Add module to Firestore in nested collection
    const docRef = await (adminDb as any)
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .add(moduleData);

    console.log('✅ Module created successfully with ID:', docRef.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Module created successfully',
        moduleId: docRef.id,
        module: moduleData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating module:', error);
    return NextResponse.json(
      {
        error: 'Failed to create module',
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
    const moduleId = searchParams.get('moduleId');
    const dayId = searchParams.get('dayId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing courseId parameter' },
        { status: 400 }
      );
    }

    if (moduleId) {
      // Fetch single module
      const doc = await (adminDb as any)
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleId)
        .get();

      if (!doc.exists) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        module: formatModuleForStreaming({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }, false)
      }, { status: 200 });
    }

    // Fetch all modules for this course and sort by creation time
    const query = (adminDb as any)
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .orderBy('createdAt', 'asc');

    const snapshot = await query.get();

    let modules = snapshot.docs.map((doc: any) => 
      formatModuleForStreaming({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }, false)
    );

    // Filter by dayId in-memory if provided to avoid requiring a composite index
    if (dayId) {
      modules = modules.filter((m: any) => m.day === dayId);
    }

    return NextResponse.json(
      {
        success: true,
        modules,
        total: modules.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching modules:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch modules',
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
    const moduleId = searchParams.get('moduleId');

    if (!courseId || !moduleId) {
      return NextResponse.json(
        { error: 'Missing courseId or moduleId' },
        { status: 400 }
      );
    }

    await (adminDb as any)
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .delete();

    return NextResponse.json(
      { success: true, message: 'Module deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting module:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete module',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
