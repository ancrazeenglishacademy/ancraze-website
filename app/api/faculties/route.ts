import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      console.warn("⚠️ [GET /api/faculties] Firebase Admin Firestore is not initialized; returning empty faculties list");
      return NextResponse.json({
        success: true,
        faculties: [],
        warning: "Firebase Admin SDK is not initialized.",
      });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = adminDb.collection("faculties");

    let snapshot;
    try {
      if (activeOnly) {
        snapshot = await query.where("active", "==", true).get();
      } else {
        snapshot = await query.get();
      }
    } catch (queryErr) {
      console.warn("Falling back to unindexed query:", queryErr);
      snapshot = await query.get();
    }

    const faculties = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        role: data.role || data.designation || "",
        experience: data.experience || "",
        specialization: data.specialization || "",
        bio: data.bio || "",
        photo: data.photo || data.imageUrl || "",
        active: data.active !== false,
        order: typeof data.order === "number" ? data.order : 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Sort in memory by order ascending, then name
    faculties.sort((a: any, b: any) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ success: true, faculties });
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error || "Unknown error");
    console.error(`❌ [GET /api/faculties] 500 Internal Server Error: ${errMsg}`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch faculties",
        message: `An unexpected error occurred while fetching faculties: ${errMsg}`,
        details: errMsg,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      console.error("❌ [POST /api/faculties] 503 Service Unavailable: Firebase Admin Firestore is not initialized");
      return NextResponse.json(
        {
          success: false,
          error: "Database service unavailable",
          message: "Firebase Admin SDK is not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local.",
        },
        { status: 503 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let name = "";
    let role = "";
    let experience = "";
    let specialization = "";
    let bio = "";
    let photo = "";
    let active = true;
    let order = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = (formData.get("name") as string) || "";
      role = (formData.get("role") as string) || (formData.get("designation") as string) || "";
      experience = (formData.get("experience") as string) || "";
      specialization = (formData.get("specialization") as string) || "";
      bio = (formData.get("bio") as string) || "";
      active = formData.get("active") !== "false";
      order = parseInt((formData.get("order") as string) || "0", 10) || 0;

      const photoFile = formData.get("photo") as File | null;
      const photoUrl = (formData.get("photoUrl") as string) || "";

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
          photo = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        } catch (uploadErr) {
          console.error("⚠️ Faculty photo upload failed:", uploadErr);
          photo = photoUrl;
        }
      } else {
        photo = photoUrl;
      }
    } else {
      const body = await request.json();
      name = body.name || "";
      role = body.role || body.designation || "";
      experience = body.experience || "";
      specialization = body.specialization || "";
      bio = body.bio || "";
      photo = body.photo || body.imageUrl || "";
      active = body.active !== false;
      order = typeof body.order === "number" ? body.order : 0;
    }

    if (!name.trim()) {
      return NextResponse.json({ error: "Faculty name is required" }, { status: 400 });
    }

    const facultyData = {
      name: name.trim(),
      role: role.trim() || "Spoken English Trainer",
      experience: experience.trim(),
      specialization: specialization.trim(),
      bio: bio.trim(),
      photo: photo.trim(),
      active: active,
      order: order,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await adminDb.collection("faculties").add(facultyData);

    return NextResponse.json(
      {
        success: true,
        message: "Faculty created successfully",
        faculty: { id: docRef.id, ...facultyData },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error || "Unknown error");
    console.error(`❌ [POST /api/faculties] 500 Internal Server Error: ${errMsg}`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create faculty",
        message: `An unexpected error occurred while creating the faculty profile: ${errMsg}`,
        details: errMsg,
      },
      { status: 500 }
    );
  }
}
