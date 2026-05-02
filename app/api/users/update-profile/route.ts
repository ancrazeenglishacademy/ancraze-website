import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 50; // 50 requests per minute per IP

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const userData = rateLimitMap.get(ip);

  if (!userData) {
    rateLimitMap.set(ip, { count: 1, lastRequest: now });
    return true;
  }

  if (now - userData.lastRequest > RATE_LIMIT_WINDOW) {
    userData.count = 1;
    userData.lastRequest = now;
    return true;
  }

  if (userData.count >= MAX_REQUESTS) {
    return false;
  }

  userData.count += 1;
  return true;
};

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey = process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;
  if (!validApiKey) {
    console.warn("⚠️ NO INTERNAL_API_KEY or NEXT_PUBLIC_INTERNAL_API_KEY is set in environment variables.");
    return true; 
  }
  return apiKey === validApiKey;
};

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    if (!adminAuth || !adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const body = await request.json();
    const { userId, fullName, photoURL } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!fullName && !photoURL) {
      return NextResponse.json({ error: "At least one of Full Name or Photo URL is required" }, { status: 400 });
    }

    const firestoreUpdate: any = {};
    const authUpdate: any = {};

    if (fullName) {
      firestoreUpdate.fullName = fullName;
      authUpdate.displayName = fullName;
    }

    if (photoURL) {
      firestoreUpdate.photoURL = photoURL;
      authUpdate.photoURL = photoURL;
    }

    // Update Firebase Auth
    await (adminAuth as any).updateUser(userId, authUpdate);

    // Update Firestore
    await (adminDb as any)
      .collection("users")
      .doc(userId)
      .update(firestoreUpdate);

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        updatedFields: Object.keys(firestoreUpdate),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
