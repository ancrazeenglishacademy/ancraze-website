import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    // Security & Enrollment Check
    let isEnrolled = false;
    let loggedInUser = null;

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const loginId = searchParams.get("loginId");
    const deviceId = searchParams.get("deviceId");
    const stdId = searchParams.get("stdId");

    // Case 1: Fetching via stdId (Direct Student ID)
    if (stdId) {
      const userDoc = await (adminDb as any).collection("users").doc(stdId).get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      const userData = userDoc.data();
      if (userData.isBlocked === true) {
        return NextResponse.json({ error: "Your account is blocked" }, { status: 403 });
      }

      const userEnrolledCourses = userData.enrolledCourses || [];
      const userRole = userData.role || "user";

      if (userEnrolledCourses.includes(id) || userRole === "admin" || userRole === "superadmin") {
        isEnrolled = true;
      }

      loggedInUser = {
        fullName: userData.fullName,
        email: userData.email,
        role: userRole,
        isEnrolled: isEnrolled
      };
    } 
    // Case 2: Fetching via email/loginId (Legacy/Login check)
    else if (email) {
      if (!loginId || !deviceId) {
        return NextResponse.json(
          {
            error: "Login ID and Device ID are required when email is provided",
          },
          { status: 400 }
        );
      }

      const userSnapshot = await (adminDb as any)
        .collection("users")
        .where("email", "==", email)
        .where("loginId", "==", loginId)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return NextResponse.json(
          { error: "Invalid email or Login ID" },
          { status: 401 }
        );
      }

      const userData = userSnapshot.docs[0].data();

      // Device Verification
      if (userData.deviceId && userData.deviceId !== deviceId) {
        return NextResponse.json(
          { error: "Access denied: Logged in on another device" },
          { status: 403 }
        );
      }

      // Check if user is blocked
      if (userData.isBlocked === true) {
        return NextResponse.json(
          { error: "Your account is blocked" },
          { status: 403 }
        );
      }

      // Check if user has bought THIS course OR is an admin
      const userEnrolledCourses = userData.enrolledCourses || [];
      const userRole = userData.role || "user";
      
      if (userEnrolledCourses.includes(id) || userRole === "admin" || userRole === "superadmin") {
        isEnrolled = true;
      }

      loggedInUser = {
        fullName: userData.fullName,
        email: userData.email,
        role: userRole,
        isEnrolled: isEnrolled
      };
    }

    // Fetch Course
    const doc = await (adminDb as any).collection("courses").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Fetch Modules
    const modulesSnapshot = await (adminDb as any)
      .collection("courses")
      .doc(id)
      .collection("modules")
      .orderBy("createdAt", "asc")
      .get();

    const modules = (modulesSnapshot as any).docs.map((mDoc: any, index: number) => {
      const data = mDoc.data();
      // Unlock all if enrolled, otherwise only first 3
      const isLocked = !isEnrolled && index >= 3;
      
      return {
        id: mDoc.id,
        ...data,
        isLocked, 
        videoUrl: isLocked ? null : (data.videoUrl || null),
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      user: loggedInUser, // Pass user enrollment details
      course: {
        id: doc.id,
        ...doc.data(),
        modules,
        isPurchased: isEnrolled,
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        updatedAt:
          doc.data().updatedAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching course by ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch course detail", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    console.log(`🗑️ Deleting course: ${id}`);

    // Delete the course document
    await (adminDb as any).collection("courses").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course", details: error.message },
      { status: 500 }
    );
  }
}
