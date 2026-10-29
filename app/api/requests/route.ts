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

    const typeFilter = request.nextUrl.searchParams.get("type");
    const statusFilter = request.nextUrl.searchParams.get("status");

    const snapshot = await (adminDb as any).collection("requests").orderBy("createdAt", "desc").get();

    let requests = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || null,
      };
    });

    if (typeFilter && typeFilter !== "all") {
      requests = requests.filter((r: any) => r.type === typeFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      requests = requests.filter((r: any) => r.status === statusFilter);
    }

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests", details: error.message },
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
      studentId,
      studentName,
      studentLoginId,
      type = "refund", // 'refund' | 'account_closure' | 'exception'
      reason,
      amount = null,
      requestedByAdminName = "Admin",
      requestedByAdminId = null,
    } = body;

    if (!studentId || !reason) {
      return NextResponse.json(
        { error: "Student ID and reason are required" },
        { status: 400 }
      );
    }

    const newRequest = {
      studentId,
      studentName: studentName || "Student",
      studentLoginId: studentLoginId || "---",
      type,
      reason,
      amount: amount ? Number(amount) : null,
      status: "pending", // 'pending' | 'approved' | 'rejected'
      requestedByAdminName,
      requestedByAdminId,
      resolutionNotes: null,
      resolvedBy: null,
      createdAt: new Date(),
      resolvedAt: null,
    };

    const docRef = await (adminDb as any).collection("requests").add(newRequest);

    // If it's an account closure request, mark the student's status as closure_requested
    if (type === "account_closure") {
      try {
        await (adminDb as any)
          .collection("users")
          .doc(studentId)
          .update({ accountStatus: "closure_requested" });
      } catch (uErr) {
        console.warn("Could not set closure_requested on student", uErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Request submitted to Super Admin",
        request: { id: docRef.id, ...newRequest },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Failed to submit request", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      throw new Error("Firebase Admin not configured");
    }

    const body = await request.json();
    const { requestId, status, resolutionNotes, resolvedBy = "Super Admin" } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: "Request ID and status (approved/rejected) are required" },
        { status: 400 }
      );
    }

    const reqDoc = await (adminDb as any).collection("requests").doc(requestId).get();
    if (!reqDoc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const reqData = reqDoc.data();

    await (adminDb as any).collection("requests").doc(requestId).update({
      status,
      resolutionNotes: resolutionNotes || "",
      resolvedBy,
      resolvedAt: new Date(),
    });

    // If approved, trigger corresponding action
    if (status === "approved") {
      if (reqData.type === "account_closure") {
        // Freeze/close the user account
        await (adminDb as any).collection("users").doc(reqData.studentId).update({
          isBlocked: true,
          accountStatus: "closed",
        });
      } else if (reqData.type === "refund" && reqData.amount) {
        // Record refund in financials
        await (adminDb as any).collection("finances").add({
          type: "refund",
          title: `Approved Refund - ${reqData.studentName}`,
          amount: Number(reqData.amount),
          currency: "INR",
          studentId: reqData.studentId,
          studentName: reqData.studentName,
          status: "refunded",
          paymentMethod: "Bank/Original Source",
          invoiceNumber: `REF-${Date.now().toString().slice(-6)}`,
          notes: resolutionNotes || reqData.reason || "",
          createdAt: new Date(),
        });
      }
    } else if (status === "rejected") {
      if (reqData.type === "account_closure") {
        // Revert to active if closure request was rejected
        await (adminDb as any).collection("users").doc(reqData.studentId).update({
          accountStatus: "active",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Request marked as ${status}`,
    });
  } catch (error: any) {
    console.error("Error updating request:", error);
    return NextResponse.json(
      { error: "Failed to update request", details: error.message },
      { status: 500 }
    );
  }
}

