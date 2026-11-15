import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !adminDb) {
      return NextResponse.json({ error: "Faculty ID is required" }, { status: 400 });
    }

    const doc = await adminDb.collection("faculties").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({
      success: true,
      faculty: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch faculty", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !adminDb) {
      return NextResponse.json({ error: "Faculty ID is required" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "";
    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const name = formData.get("name") as string | null;
      const role = (formData.get("role") as string) || (formData.get("designation") as string) || null;
      const experience = formData.get("experience") as string | null;
      const specialization = formData.get("specialization") as string | null;
      const bio = formData.get("bio") as string | null;
      const activeStr = formData.get("active") as string | null;
      const orderStr = formData.get("order") as string | null;
      const photoFile = formData.get("photo") as File | null;
      const photoUrl = formData.get("photoUrl") as string | null;

      if (name !== null) updateData.name = name.trim();
      if (role !== null) updateData.role = role.trim();
      if (experience !== null) updateData.experience = experience.trim();
      if (specialization !== null) updateData.specialization = specialization.trim();
      if (bio !== null) updateData.bio = bio.trim();
      if (activeStr !== null) updateData.active = activeStr !== "false";
      if (orderStr !== null) updateData.order = parseInt(orderStr, 10) || 0;

      if (photoFile && typeof photoFile === "object" && photoFile.size > 0 && adminStorage) {
        try {
          const bucket = adminStorage.bucket();
          const fileName = `faculties/${Date.now()}_${photoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const file = bucket.file(fileName);
          const buffer = await photoFile.arrayBuffer();
          await file.save(Buffer.from(buffer), {
            metadata: { contentType: photoFile.type || "image/jpeg" },
          });
          await file.makePublic();
          updateData.photo = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        } catch (uploadErr) {
          console.error("⚠️ Faculty photo upload failed:", uploadErr);
          if (photoUrl) updateData.photo = photoUrl.trim();
        }
      } else if (photoUrl !== null && photoUrl !== undefined) {
        updateData.photo = photoUrl.trim();
      }
    } else {
      const body = await request.json();
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.role !== undefined || body.designation !== undefined) {
        updateData.role = (body.role || body.designation || "").trim();
      }
      if (body.experience !== undefined) updateData.experience = body.experience.trim();
      if (body.specialization !== undefined) updateData.specialization = body.specialization.trim();
      if (body.bio !== undefined) updateData.bio = body.bio.trim();
      if (body.photo !== undefined) updateData.photo = body.photo.trim();
      if (body.active !== undefined) updateData.active = Boolean(body.active);
      if (body.order !== undefined) updateData.order = Number(body.order) || 0;
    }

    await adminDb.collection("faculties").doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Faculty updated successfully",
      updated: updateData,
    });
  } catch (error: any) {
    console.error("❌ Error updating faculty:", error);
    return NextResponse.json(
      { error: "Failed to update faculty", details: error.message },
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
    if (!id || !adminDb) {
      return NextResponse.json({ error: "Faculty ID is required" }, { status: 400 });
    }

    await adminDb.collection("faculties").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting faculty:", error);
    return NextResponse.json(
      { error: "Failed to delete faculty", details: error.message },
      { status: 500 }
    );
  }
}
