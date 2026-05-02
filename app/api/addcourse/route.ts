import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize admin SDK
let adminDb: any = null;
let adminStorage: any = null;

const initializeFirebaseAdmin = () => {
  if (adminDb && adminStorage) return;

  if (
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PRIVATE_KEY !== 'your_private_key_here'
  ) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }

      adminDb = admin.firestore();
      adminStorage = admin.storage();
    } catch (error) {
      console.error('❌ Firebase Admin initialization error:', error);
      throw new Error('Firebase Admin not initialized');
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    if (!adminDb || !adminStorage) {
      throw new Error('Firebase Admin services not available');
    }

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const teacherName = formData.get('teacherName') as string;
    const price = parseFloat(formData.get('price') as string);
    const coverImage = formData.get('coverImage') as File;

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
      const bucket = adminStorage.bucket();
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
      price: price,
      coverImage: imageUrl,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await adminDb.collection('courses').add(courseData);

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
  try {
    // This endpoint can be extended to fetch courses
    return NextResponse.json(
      { message: 'Use POST method to create a course' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
