import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

let adminStorage: any = null;

const initializeFirebaseAdmin = () => {
  if (adminStorage) return;

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

    if (!adminStorage) {
      throw new Error('Firebase Storage not available');
    }

    console.log('📹 Video upload request received');

    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const courseId = formData.get('courseId') as string;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'No courseId provided' },
        { status: 400 }
      );
    }

    console.log('📹 Video details - Name:', videoFile.name, 'Size:', videoFile.size, 'Type:', videoFile.type);

    try {
      const bucket = adminStorage.bucket();
      
      // Upload Video
      const videoFileName = `modules/${courseId}/${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const vFile = bucket.file(videoFileName);
      const vBuffer = await videoFile.arrayBuffer();
      await vFile.save(Buffer.from(vBuffer), { metadata: { contentType: videoFile.type } });
      await vFile.makePublic();
      const videoUrl = `https://storage.googleapis.com/${bucket.name}/${videoFileName}`;

      // Upload Thumbnail if provided
      let thumbnailUrl = "";
      if (thumbnailFile) {
        const thumbFileName = `modules/${courseId}/thumb_${Date.now()}_${thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const tFile = bucket.file(thumbFileName);
        const tBuffer = await thumbnailFile.arrayBuffer();
        await tFile.save(Buffer.from(tBuffer), { metadata: { contentType: thumbnailFile.type } });
        await tFile.makePublic();
        thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbFileName}`;
      }

      console.log('✅ Uploads successful');

      return NextResponse.json(
        {
          success: true,
          message: 'Video and thumbnail uploaded successfully',
          videoUrl,
          thumbnailUrl,
        },
        { status: 200 }
      );
    } catch (storageError) {
      console.error('❌ Storage upload error:', storageError);
      return NextResponse.json(
        {
          error: 'Failed to upload video',
          details: storageError instanceof Error ? storageError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in video upload:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
