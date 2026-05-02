import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

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

    // Create module data
    const moduleData = {
      courseId,
      title: moduleTitle,
      videoUrl: videoUrl || 'no video url',
      questions: questions || [],
      duration: duration || '',
      day: body.day || '',
      description: description || '',
      thumbnailUrl: thumbnailUrl || '',
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
        module: {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      }, { status: 200 });
    }

    // Fetch all modules for this course and sort by creation time
    const query = (adminDb as any)
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .orderBy('createdAt', 'asc');

    const snapshot = await query.get();

    let modules = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

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
