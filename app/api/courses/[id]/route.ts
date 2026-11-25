import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { computeCourseAccessAndLocking } from "@/lib/mux";

export const dynamic = "force-dynamic";

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
    let isAdminOrTrainer = false;
    let loggedInUser = null;
    let matchedUserData: any = null;
    let studentDocId = "";

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const loginId = searchParams.get("loginId");
    const deviceId = searchParams.get("deviceId");
    const stdId = searchParams.get("stdId") || searchParams.get("userId");

    // Case 1: Fetching via stdId (Direct Student ID)
    if (stdId) {
      const userDoc = await (adminDb as any).collection("users").doc(stdId).get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      const userData = userDoc.data();
      matchedUserData = userData;
      studentDocId = userDoc.id;
      if (userData.isBlocked === true) {
        return NextResponse.json({ error: "Your account is blocked" }, { status: 403 });
      }

      const userEnrolledCourses = userData.enrolledCourses || [];
      const userRole = userData.role || "user";

      if (
        userRole === "admin" ||
        userRole === "superadmin" ||
        userRole === "trainer" ||
        userData.isTrainerPreviewAccount === true ||
        userData.trainerPreviewAccount === true
      ) {
        isEnrolled = true;
        isAdminOrTrainer = true;
      } else if (userEnrolledCourses.includes(id)) {
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
      if (!loginId) {
        return NextResponse.json(
          {
            error: "Login ID is required when email is provided",
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
      matchedUserData = userData;
      studentDocId = userSnapshot.docs[0].id;

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
      
      if (
        userRole === "admin" ||
        userRole === "superadmin" ||
        userRole === "trainer" ||
        userData.isTrainerPreviewAccount === true ||
        userData.trainerPreviewAccount === true
      ) {
        isEnrolled = true;
        isAdminOrTrainer = true;
      } else if (userEnrolledCourses.includes(id)) {
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
    const courseData = doc.data();

    // Fetch Days
    const daysSnapshot = await (adminDb as any)
      .collection("courses")
      .doc(id)
      .collection("days")
      .orderBy("order", "asc")
      .get();

    const rawDays = daysSnapshot.docs.map((dDoc: any) => ({
      id: dDoc.id,
      ...dDoc.data(),
      modules: [] as any[],
      createdAt:
        dDoc.data().createdAt?.toDate?.()?.toISOString() ||
        new Date().toISOString(),
    }));

    // Fetch Modules
    const modulesSnapshot = await (adminDb as any)
      .collection("courses")
      .doc(id)
      .collection("modules")
      .orderBy("createdAt", "asc")
      .get();

    const rawModules = (modulesSnapshot as any).docs.map((mDoc: any) => {
      const data = mDoc.data();
      return {
        id: mDoc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      };
    });

    rawModules.forEach((mod: any) => {
      const dayIdx = rawDays.findIndex((d: any) => d.id === mod.day);
      if (dayIdx !== -1) {
        rawDays[dayIdx].modules.push(mod);
      }
    });

    // Count approved/completed tasks for this student if trainer-guided
    let approvedTasksCount = 0;
    if (isEnrolled && courseData?.isTrainerGuided && studentDocId) {
      try {
        const tasksSnap = await (adminDb as any)
          .collection("tasks")
          .where("studentId", "==", studentDocId)
          .get();
        approvedTasksCount = tasksSnap.docs.filter((tDoc: any) => {
          const t = tDoc.data();
          const isDone = t.status === "approved" || t.status === "completed";
          const matchesCourse = !t.courseId || t.courseId === id;
          return isDone && matchesCourse;
        }).length;
      } catch (tErr) {
        console.warn("Could not query tasks for student course unlocking:", tErr);
      }
    }

    const lockedResult = computeCourseAccessAndLocking({
      courseId: id,
      courseData,
      days: rawDays,
      modules: rawModules,
      userData: matchedUserData,
      isPurchased: isEnrolled,
      isAdminOrTrainer,
      approvedTasksCount,
    });

    return NextResponse.json({
      success: true,
      user: loggedInUser, // Pass user enrollment details
      accessControl: lockedResult.accessControl,
      course: {
        id: doc.id,
        ...courseData,
        days: lockedResult.days,
        modules: lockedResult.modules,
        accessControl: lockedResult.accessControl,
        isPurchased: isEnrolled,
        createdAt:
          courseData.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        updatedAt:
          courseData.updatedAt?.toDate?.()?.toISOString() ||
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
