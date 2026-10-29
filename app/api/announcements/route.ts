import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const checkApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey =
    process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY;

  if (!validApiKey) {
    return true;
  }
  return apiKey === validApiKey;
};

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin not configured");
    }

    const targetRole = request.nextUrl.searchParams.get("targetRole");
    const snapshot = await (adminDb as any)
      .collection("announcements")
      .orderBy("createdAt", "desc")
      .get();

    let announcements = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    if (targetRole && targetRole !== "all") {
      announcements = announcements.filter(
        (a: any) => a.targetRole === "all" || a.targetRole === targetRole
      );
    }

    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin not configured");
    }

    const body = await request.json();
    const {
      title,
      content,
      targetRole = "all", // 'all' | 'students' | 'trainers' | 'admins'
      priority = "normal", // 'normal' | 'urgent'
      authorName = "Academy Administration",
      authorRole = "admin",
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const newAnnouncement = {
      title,
      content,
      targetRole,
      priority,
      authorName,
      authorRole,
      createdAt: new Date(),
    };

    const docRef = await (adminDb as any).collection("announcements").add(newAnnouncement);

    return NextResponse.json(
      {
        success: true,
        message: "Announcement broadcasted successfully",
        announcement: { id: docRef.id, ...newAnnouncement },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin not configured");
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Announcement ID required" }, { status: 400 });
    }

    await (adminDb as any).collection("announcements").doc(id).delete();

    return NextResponse.json({ success: true, message: "Announcement deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete announcement", details: error.message },
      { status: 500 }
    );
  }
}

