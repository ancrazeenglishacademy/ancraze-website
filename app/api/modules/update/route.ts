import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

async function uploadTaskImageToFirebaseStorage(
  courseId: string,
  moduleId: string,
  taskImageInput?: string | null
): Promise<string | undefined> {
  if (taskImageInput === undefined) return undefined;
  if (taskImageInput === null || taskImageInput === "") return "";
  if (taskImageInput.startsWith("http://") || taskImageInput.startsWith("https://")) {
    return taskImageInput;
  }
  if (taskImageInput.startsWith("data:image/") && adminStorage) {
    try {
      const mimeMatch = taskImageInput.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      const base64Data = taskImageInput.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const bucket = (adminStorage as any).bucket();
      const fileName = `courses/${courseId}/tasks/${moduleId}_${Date.now()}_task.${ext}`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType,
        },
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log("✅ Updated module task image uploaded to Firebase Storage:", publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("❌ Error uploading updated task image:", err);
      return undefined;
    }
  }
  return undefined;
}

export async function PUT(request: NextRequest) {
  try {
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
      playbackId,
      assetId,
      streamType,
      duration,
      day,
      description,
      thumbnailUrl,
      taskTitle,
      taskDescription,
      taskType,
      taskImage,
      taskImageUrl,
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
    if (playbackId !== undefined) {
      updateData.playbackId = playbackId;
      if (playbackId && !videoUrl) {
        updateData.videoUrl = `https://stream.mux.com/${playbackId}.m3u8`;
      }
      if (playbackId && !thumbnailUrl) {
        updateData.thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      }
    }
    if (assetId !== undefined) updateData.assetId = assetId;
    if (streamType !== undefined) updateData.streamType = streamType;
    if (duration !== undefined) updateData.duration = duration;
    if (day !== undefined) updateData.day = day;
    if (description !== undefined) updateData.description = description;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;

    const rawTaskImageInput = taskImage !== undefined ? taskImage : taskImageUrl;
    const resolvedTaskImageUrl = await uploadTaskImageToFirebaseStorage(
      courseId,
      moduleId,
      rawTaskImageInput
    );

    if (taskTitle !== undefined) updateData.taskTitle = String(taskTitle).trim();
    if (taskDescription !== undefined) updateData.taskDescription = String(taskDescription).trim();
    if (taskType !== undefined) updateData.taskType = String(taskType).trim() || "speaking_recording";
    if (resolvedTaskImageUrl !== undefined) updateData.taskImageUrl = resolvedTaskImageUrl;

    if (
      taskTitle !== undefined ||
      taskDescription !== undefined ||
      taskType !== undefined ||
      resolvedTaskImageUrl !== undefined
    ) {
      // Fetch existing module doc to merge task object cleanly
      const existingDoc = await adminDb
        .collection("courses")
        .doc(courseId)
        .collection("modules")
        .doc(moduleId)
        .get();
      const existingData = existingDoc.exists ? existingDoc.data() : {};

      const mergedTaskTitle =
        updateData.taskTitle !== undefined ? updateData.taskTitle : existingData.taskTitle || "";
      const mergedTaskDesc =
        updateData.taskDescription !== undefined
          ? updateData.taskDescription
          : existingData.taskDescription || "";
      const mergedTaskType =
        updateData.taskType !== undefined
          ? updateData.taskType
          : existingData.taskType || "speaking_recording";
      const mergedTaskImage =
        updateData.taskImageUrl !== undefined
          ? updateData.taskImageUrl
          : existingData.taskImageUrl || "";

      const hasTask = Boolean(mergedTaskTitle || mergedTaskDesc || mergedTaskImage);
      updateData.task = hasTask
        ? {
            title: mergedTaskTitle,
            description: mergedTaskDesc,
            type: mergedTaskType,
            imageUrl: mergedTaskImage,
          }
        : null;
    }

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
