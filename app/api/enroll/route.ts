import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey =
    process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;

  if (!validApiKey) {
    console.warn("⚠️ NO INTERNAL_API_KEY is set in environment variables.");
    return true; // fallback if not set
  }

  return apiKey === validApiKey;
};

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    const { courseId, userId } = await request.json();

    if (!courseId || !userId) {
      return NextResponse.json(
        { success: false, message: "Course ID and User ID are required" },
        { status: 400 }
      );
    }

    // Add courseId to enrolledCourses array using FieldValue.arrayUnion
    await (adminDb as any).collection("users").doc(userId).update({
      enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId),
    });

    return NextResponse.json({ success: true, message: "Successfully enrolled" });
  } catch (error: any) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to enroll" },
      { status: 500 }
    );
  }
}
