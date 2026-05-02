import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

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
  if (userData.count >= MAX_REQUESTS) return false;
  userData.count += 1;
  return true;
};

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey = process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;
  if (!validApiKey) {
    console.warn("⚠️ NO INTERNAL_API_KEY set");
    return true; 
  }
  return apiKey === validApiKey;
};

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedRole = searchParams.get("role");

    // Fetch all users
    const snapshot = await (adminDb as any).collection("users").get();

    let users = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt:
        doc.data().createdAt?.toDate?.()?.toISOString() ||
        new Date().toISOString(),
    }));

    if (requestedRole && requestedRole !== "all") {
      users = users.filter((u: any) => u.role === requestedRole);
    }

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and Role are required" },
        { status: 400 },
      );
    }

    const allowedRoles = ["superadmin", "admin", "trainer", "student", "user"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role provided." },
        { status: 400 },
      );
    }

    await (adminDb as any).collection("users").doc(userId).update({ role });

    return NextResponse.json(
      {
        success: true,
        message: "User role updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    return NextResponse.json(
      {
        error: "Failed to update user role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
