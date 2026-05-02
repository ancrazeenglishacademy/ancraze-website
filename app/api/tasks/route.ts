import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey = process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;
  
  if (!validApiKey) {
    console.warn("⚠️ NO INTERNAL_API_KEY or NEXT_PUBLIC_INTERNAL_API_KEY is set in environment variables.");
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
        createdAt: taskData.createdAt?.toDate?.() || taskData.createdAt,
        dueDate: taskData.dueDate?.toDate?.() || taskData.dueDate,
        updatedAt: taskData.updatedAt?.toDate?.() || taskData.updatedAt,
      };

      // Populate student details
      if (taskData.studentId) {
        const studentDoc = await adminDb.collection("users").doc(taskData.studentId).get();
        if (studentDoc.exists) {
          const studentData = studentDoc.data();
          populatedTask.student = {
            id: studentDoc.id,
            fullName: studentData.fullName,
            email: studentData.email,
            photoURL: studentData.photoURL || null,
          };
        }
      }

      // Populate trainer details
      if (taskData.trainerId) {
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
      }

      return populatedTask;
    };

    // If taskId is provided, fetch and return a single task
    if (taskId) {
      const doc = await adminDb.collection("tasks").doc(taskId).get();
      if (!doc.exists) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }
      
      const populatedTask = await populateTask(doc.data(), doc.id);
      
      return NextResponse.json(
        {
          success: true,
          task: populatedTask,
        },
        { status: 200 }
      );
    }

    let query = adminDb.collection("tasks");

    if (studentId) {
      query = query.where("studentId", "==", studentId);
    } else if (trainerId) {
      query = query.where("trainerId", "==", trainerId);
    } else {
      return NextResponse.json(
        { error: "Either studentId or trainerId is required" },
        { status: 400 }
      );
    }

    const snapshot = await query.get();
    
    // Process and populate all tasks
    const tasks = await Promise.all(
      snapshot.docs.map((doc: any) => populateTask(doc.data(), doc.id))
    );

    // Perform sorting in-memory to avoid the need for composite indexes in Firestore
    tasks.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order
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
 * POST /api/tasks
 * Trainer assigns a task to a student
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
    const { title, description, studentId, trainerId, dueDate } = body;

    // Validation
    if (!title || !studentId || !trainerId) {
      return NextResponse.json(
        { error: "Title, Student ID, and Trainer ID are required" },
        { status: 400 }
      );
    }

    const newTask = {
      title,
      description: description || "",
      studentId,
      trainerId,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "pending", // Default status
      submission: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("tasks").add(newTask);

    return NextResponse.json(
      { 
        success: true, 
        message: "Task assigned successfully", 
        taskId: docRef.id,
        task: { id: docRef.id, ...newTask }
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
 * Update task status or details
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
    const { taskId, status, submission, title, description, dueDate } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Fields that can be updated by anyone (usually student submitting or trainer approving)
    if (status) updateData.status = status;
    if (submission !== undefined) updateData.submission = submission;

    // Fields usually updated only by trainer
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    await adminDb.collection("tasks").doc(taskId).update(updateData);

    return NextResponse.json(
      { success: true, message: "Task updated successfully" },
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
 * Delete a task
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
