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

// Helper to generate a random login ID
const generateLoginId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");

    if (studentId) {
      // Fetch single student
      const doc = await (adminDb as any)
        .collection("users")
        .doc(studentId)
        .get();
      if (!doc.exists) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 },
        );
      }

      const data = doc.data();
      return NextResponse.json(
        {
          success: true,
          student: {
            id: doc.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          },
        },
        { status: 200 },
      );
    }

    // Fetch all students/staff
    const requestedRole = searchParams.get("role");
    const trainerIdFilter = searchParams.get("trainerId");

    const snapshot = await (adminDb as any).collection("users").get();

    const students = snapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      }))
      .filter((u: any) => {
        // Filter by trainerId if provided
        if (trainerIdFilter && u.trainerId !== trainerIdFilter) return false;

        // Filter by role if provided
        if (requestedRole) return u.role === requestedRole;
        
    // Default student/user/trainer roles
        return (
          u.role === "student" ||
          u.role === "user" ||
          u.role === "trainer" ||
          !u.role
        );
      });

    // Resolve course details for each student (without modules)
    const coursesSnapshot = await (adminDb as any).collection("courses").get();
    const coursesMap = new Map();
    coursesSnapshot.docs.forEach((doc: any) => {
      coursesMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      });
    });

    const studentsWithCourses = students.map((student: any) => {
      const enrolledCourseIds = student.enrolledCourses || [];
      const enrolledCoursesDetails = enrolledCourseIds
        .map((id: string) => coursesMap.get(id))
        .filter(Boolean);

      return {
        ...student,
        enrolledCoursesDetails,
      };
    });

    return NextResponse.json({ success: true, students: studentsWithCourses }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch students",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

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
    const { email, fullName, enrolledCourses } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email and Full Name are required" },
        { status: 400 },
      );
    }

    // Check if user already exists in Auth
    try {
      await (adminAuth as any).getUserByEmail(email);
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    } catch (err: any) {
      if (err.code !== "auth/user-not-found") throw err;
    }

    const loginId = generateLoginId();

    // Get admin details from cookies
    const adminUid = request.cookies.get("uid")?.value;
    const adminName = request.cookies.get("fullName")?.value;

    // Create user in Firebase Auth with loginId as password
    const userRecord = await (adminAuth as any).createUser({
      email,
      password: loginId,
      displayName: fullName,
    });

    const studentData = {
      uid: userRecord.uid,
      email,
      fullName,
      loginId, // Store the plain loginId for admin reference
      role: "student",
      trainerId: body.trainerId || null,
      enrolledCourses: enrolledCourses || [],
      createdAt: new Date(),
      authProvider: "email",
      createdByAdminUid: adminUid || null,
      createdByAdminName: adminName || "Admin",
    };

    // Save to Firestore
    await (adminDb as any)
      .collection("users")
      .doc(userRecord.uid)
      .set(studentData);

    return NextResponse.json(
      {
        success: true,
        message: "Student added successfully",
        student: studentData,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Error adding student:", error);
    return NextResponse.json(
      {
        error: "Failed to add student",
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
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    if (!adminAuth || !adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const body = await request.json();
    const { studentId, fullName, enrolledCourses, resetDeviceId, role } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (enrolledCourses) updateData.enrolledCourses = enrolledCourses;
    if (resetDeviceId) updateData.deviceId = null; // Option to clear deviceId for student
    if (role) updateData.role = role;
    const { trainerId } = body;
    if (trainerId !== undefined) updateData.trainerId = trainerId;

    await (adminDb as any)
      .collection("users")
      .doc(studentId)
      .update(updateData);

    return NextResponse.json(
      {
        success: true,
        message: "Student updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error updating student:", error);
    return NextResponse.json(
      {
        error: "Failed to update student",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    // Delete from Auth
    try {
      await (adminAuth as any).deleteUser(studentId);
    } catch (authErr) {
      console.warn("Student not found in Auth or deletion failed", authErr);
    }

    // Delete from Firestore
    await (adminDb as any).collection("users").doc(studentId).delete();

    return NextResponse.json(
      {
        success: true,
        message: "Student deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error deleting student:", error);
    return NextResponse.json(
      {
        error: "Failed to delete student",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
