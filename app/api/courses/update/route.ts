import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

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

export async function PUT(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    if (!adminDb) {
      throw new Error('Firebase Admin not available');
    }

    console.log('📝 Course UPDATE request received');

    const body = await request.json();
    const { courseId, title, description, price, coverImage } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing courseId' },
        { status: 400 }
      );
    }

    let coverImageUrl = '';

    // Handle cover image upload if provided
    if (coverImage && coverImage.startsWith('data:')) {
      try {
        console.log('📷 Uploading new cover image...');
        
        // Convert base64 to buffer
        const base64Data = coverImage.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const bucket = adminStorage.bucket();
        const fileName = `courses/${courseId}/${Date.now()}_cover.jpg`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
          metadata: {
            contentType: 'image/jpeg',
          },
        });

        await file.makePublic();
        coverImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log('✅ Cover image uploaded:', coverImageUrl);
      } catch (uploadError) {
        console.error('⚠️ Cover image upload failed:', uploadError);
        // Continue without updating image
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (coverImageUrl) updateData.coverImage = coverImageUrl;

    // Update course in Firestore
    await adminDb.collection('courses').doc(courseId).update(updateData);

    console.log('✅ Course updated successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Course updated successfully',
        course: updateData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating course:', error);
    return NextResponse.json(
      {
        error: 'Failed to update course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
