import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey = process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;
  
  if (!validApiKey) {
    return true; 
  }
  
  return apiKey === validApiKey;
};

/**
 * GET /api/tasks
 * Supports filtering by studentId or trainerId
 */
export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get("taskId");
    const studentId = searchParams.get("studentId");
    const trainerId = searchParams.get("trainerId");

    // Helper function to fetch user data and populate the task
    const populateTask = async (taskData: any, docId: string) => {
      const populatedTask: any = {
        id: docId,
        ...taskData,
        createdAt: taskData.createdAt?.toDate?.()?.toISOString() || taskData.createdAt || new Date().toISOString(),
        dueDate: taskData.dueDate?.toDate?.()?.toISOString() || taskData.dueDate || null,
        updatedAt: taskData.updatedAt?.toDate?.()?.toISOString() || taskData.updatedAt || null,
        evaluatedAt: taskData.evaluatedAt?.toDate?.()?.toISOString() || taskData.evaluatedAt || null,
      };

      // Populate student details
      if (taskData.studentId) {
        try {
          const studentDoc = await adminDb.collection("users").doc(taskData.studentId).get();
          if (studentDoc.exists) {
            const studentData = studentDoc.data();
            populatedTask.student = {
              id: studentDoc.id,
              fullName: studentData.fullName,
              email: studentData.email,
              loginId: studentData.loginId || null,
              photoURL: studentData.photoURL || null,
            };
          }
        } catch (sErr) {
          console.warn("Could not populate student", sErr);
        }
      }

      // Populate trainer details
      if (taskData.trainerId) {
        try {
          const trainerDoc = await adminDb.collection("users").doc(taskData.trainerId).get();
          if (trainerDoc.exists) {
            const trainerData = trainerDoc.data();
            populatedTask.trainer = {
              id: trainerDoc.id,
              fullName: trainerData.fullName,
              email: trainerData.email,
              photoURL: trainerData.photoURL || null,
            };
          }
        } catch (tErr) {
          console.warn("Could not populate trainer", tErr);
        }
      }

      return populatedTask;
    };

    // If taskId is provided, fetch single task
    if (taskId) {
      const doc = await adminDb.collection("tasks").doc(taskId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      
      const populatedTask = await populateTask(doc.data(), doc.id);
      return NextResponse.json({ success: true, task: populatedTask }, { status: 200 });
    }

    let query = adminDb.collection("tasks");

    if (studentId) {
      query = query.where("studentId", "==", studentId);
    } else if (trainerId) {
      query = query.where("trainerId", "==", trainerId);
    }

    const snapshot = await query.get();
    
    // Process and populate all tasks
    const tasks = await Promise.all(
      snapshot.docs.map((doc: any) => populateTask(doc.data(), doc.id))
    );

    tasks.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, tasks }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: When a trainer marks a day's task as completed/approved,
 * unlock the next 3 days' videos for the student in trainer-guided courses.
 */
async function unlockNextThreeDaysOnTaskCompletion(options: {
  studentId: string;
  taskId: string;
  courseId?: string | null;
  dayId?: string | null;
  dayNumber?: number | null;
}) {
  const { studentId, taskId, courseId, dayId, dayNumber } = options;
  if (!adminDb || !studentId) return null;

  try {
    const studentRef = adminDb.collection("users").doc(studentId);
    const studentDoc = await studentRef.get();
    if (!studentDoc.exists) return null;

    const studentData = studentDoc.data() || {};
    const targetCourseIds: string[] = courseId
      ? [courseId]
      : Array.isArray(studentData.enrolledCourses)
      ? studentData.enrolledCourses
      : [];

    if (targetCourseIds.length === 0) return null;

    const existingCourseProgress = studentData.courseProgress || {};
    const updatedProgressMap: Record<string, any> = {};

    for (const cId of targetCourseIds) {
      const current = existingCourseProgress[cId] || {};
      const completedTaskIds: string[] = Array.isArray(current.completedTaskIds)
        ? [...current.completedTaskIds]
        : [];

      // Prevent double-counting the exact same taskId if already unlocked
      if (taskId && completedTaskIds.includes(taskId)) {
        updatedProgressMap[cId] = current;
        continue;
      }
      if (taskId) completedTaskIds.push(taskId);

      const completedDayIds: string[] = Array.isArray(current.completedDayIds)
        ? [...current.completedDayIds]
        : [];
      const isNewDayCompletion = dayId ? !completedDayIds.includes(dayId) : true;
      if (dayId && !completedDayIds.includes(dayId)) {
        completedDayIds.push(dayId);
      }

      const prevCompletedCount = Number(current.completedTasksCount || 0);
      const newCompletedCount = Math.max(
        isNewDayCompletion ? prevCompletedCount + 1 : prevCompletedCount,
        completedDayIds.length
      );
      const prevUnlockedDays = Number(current.unlockedDaysCount || 1);

      // Unlock the next 3 days' videos when trainer marks a day's task completed
      const newUnlockedDays = Math.max(
        isNewDayCompletion ? prevUnlockedDays + 3 : prevUnlockedDays,
        dayNumber ? Number(dayNumber) + 3 : 0,
        1 + newCompletedCount * 3
      );

      const nextCourseProgress = {
        ...current,
        courseId: cId,
        completedTasksCount: newCompletedCount,
        completedTaskIds,
        completedDayIds,
        unlockedDaysCount: newUnlockedDays,
        lastTaskCompletedAt: new Date(),
        lastCompletedTaskId: taskId,
      };

      updatedProgressMap[cId] = nextCourseProgress;
      await studentRef.update({
        [`courseProgress.${cId}`]: nextCourseProgress,
      });
    }

    return updatedProgressMap;
  } catch (err) {
    console.error("❌ Error unlocking next 3 days on task completion:", err);
    return null;
  }
}

/**
 * POST /api/tasks
 */
export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const body = await request.json();
    const {
      title,
      description,
      studentId,
      trainerId,
      courseId = null,
      dayId = null,
      dayNumber = null,
      moduleId = null,
      taskImageUrl = null,
      dueDate,
      taskType = "assignment", // 'assignment' | 'exercise' | 'quiz' | 'speaking_recording'
      audioRecordingUrl = null,
      submission = "",
      status = "pending",
    } = body;

    if (!title || !studentId) {
      return NextResponse.json(
        { error: "Title and Student ID are required" },
        { status: 400 }
      );
    }

    const isCompletedInitially = status === "approved" || status === "completed";

    const newTask = {
      title,
      description: description || "",
      studentId,
      trainerId: trainerId || null,
      courseId: courseId || null,
      dayId: dayId || null,
      dayNumber: dayNumber ? Number(dayNumber) : null,
      moduleId: moduleId || null,
      taskImageUrl: taskImageUrl || null,
      taskType,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || "pending", // 'pending' | 'submitted' | 'approved' | 'needs_correction' | 'completed'
      submission,
      audioRecordingUrl,
      trainerFeedback: body.trainerFeedback || "",
      score: body.score !== undefined && body.score !== null ? Number(body.score) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      evaluatedAt: isCompletedInitially ? new Date() : null,
    };

    const docRef = await adminDb.collection("tasks").add(newTask);

    let unlockedProgress = null;
    if (isCompletedInitially) {
      unlockedProgress = await unlockNextThreeDaysOnTaskCompletion({
        studentId,
        taskId: docRef.id,
        courseId,
        dayId,
        dayNumber: dayNumber ? Number(dayNumber) : null,
      });
    }

    return NextResponse.json(
      { 
        success: true, 
        message: isCompletedInitially
          ? "Day task marked completed and next 3 days' videos unlocked!"
          : "Task assigned successfully", 
        taskId: docRef.id,
        task: { id: docRef.id, ...newTask },
        courseProgress: unlockedProgress,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error assigning task:", error);
    return NextResponse.json(
      { error: "Failed to assign task", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks
 */
export async function PATCH(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const body = await request.json();
    const {
      taskId,
      status,
      submission,
      audioRecordingUrl,
      trainerFeedback,
      score,
      title,
      description,
      dueDate,
      taskType,
      courseId,
      dayId,
      dayNumber,
      moduleId,
      taskImageUrl,
    } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const existingDoc = await adminDb.collection("tasks").doc(taskId).get();
    if (!existingDoc.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    const existingTask = existingDoc.data() || {};

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === "approved" || status === "completed" || status === "needs_correction") {
        updateData.evaluatedAt = new Date();
      }
    }
    if (submission !== undefined) updateData.submission = submission;
    if (audioRecordingUrl !== undefined) updateData.audioRecordingUrl = audioRecordingUrl;
    if (trainerFeedback !== undefined) updateData.trainerFeedback = trainerFeedback;
    if (score !== undefined) updateData.score = score !== null ? Number(score) : null;
    if (taskType) updateData.taskType = taskType;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (courseId !== undefined) updateData.courseId = courseId;
    if (dayId !== undefined) updateData.dayId = dayId;
    if (dayNumber !== undefined) updateData.dayNumber = dayNumber !== null ? Number(dayNumber) : null;
    if (moduleId !== undefined) updateData.moduleId = moduleId;
    if (taskImageUrl !== undefined) updateData.taskImageUrl = taskImageUrl;

    await adminDb.collection("tasks").doc(taskId).update(updateData);

    // If trainer marked the day's task as completed / approved, unlock the next 3 days' videos!
    let unlockedProgress = null;
    if (status === "approved" || status === "completed") {
      const targetStudentId = existingTask.studentId;
      unlockedProgress = await unlockNextThreeDaysOnTaskCompletion({
        studentId: targetStudentId,
        taskId,
        courseId: courseId || existingTask.courseId || null,
        dayId: dayId || existingTask.dayId || null,
        dayNumber: dayNumber ?? existingTask.dayNumber ?? null,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message:
          status === "approved" || status === "completed"
            ? "Task completed! Next 3 days' videos unlocked for the student."
            : "Task evaluated / updated successfully",
        courseProgress: unlockedProgress,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks
 */
export async function DELETE(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin services not available");
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    await adminDb.collection("tasks").doc(taskId).delete();

    return NextResponse.json(
      { success: true, message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task", details: error.message },
      { status: 500 }
    );
  }
}
