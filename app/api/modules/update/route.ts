import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

let adminDb: any = null;

const initializeFirebaseAdmin = () => {
  if (adminDb) return;

  if (
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PRIVATE_KEY !== "your_private_key_here"
  ) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, "\n");

      const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url:
          process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(
            serviceAccount as admin.ServiceAccount,
          ),
        });
      }

      adminDb = admin.firestore();
    } catch (error) {
      console.error("❌ Firebase Admin initialization error:", error);
      throw new Error("Firebase Admin not initialized");
    }
  }
};

export async function PUT(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    if (!adminDb) {
      throw new Error("Firebase Admin not available");
    }

    console.log("📝 Module UPDATE request received");

    const body = await request.json();
    const {
      courseId,
      moduleId,
      title,
      questions,
      videoUrl,
      duration,
      day,
      description,
      thumbnailUrl,
    } = body;

    if (!courseId || !moduleId) {
      return NextResponse.json(
        { error: "Missing courseId or moduleId" },
        { status: 400 },
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (title) updateData.title = title;
    if (questions) updateData.questions = questions;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (duration !== undefined) updateData.duration = duration;
    if (day !== undefined) updateData.day = day;
    if (description !== undefined) updateData.description = description;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;

    // Update module in Firestore
    await adminDb
      .collection("courses")
      .doc(courseId)
      .collection("modules")
      .doc(moduleId)
      .update(updateData);

    console.log("✅ Module updated successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Module updated successfully",
        module: updateData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error updating module:", error);
    return NextResponse.json(
      {
        error: "Failed to update module",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
