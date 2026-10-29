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
    const snapshot = await (adminDb as any).collection("finances").orderBy("createdAt", "desc").get();

    let records = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    if (typeFilter && typeFilter !== "all") {
      records = records.filter((r: any) => r.type === typeFilter);
    }

    // Aggregations
    let totalRevenue = 0;
    let totalExpenses = 0;
    let pendingBalances = 0;
    let totalRefunds = 0;

    records.forEach((r: any) => {
      const amt = Number(r.amount) || 0;
      if (r.type === "revenue") {
        if (r.status === "completed") {
          totalRevenue += amt;
        } else if (r.status === "pending") {
          pendingBalances += amt;
        }
      } else if (r.type === "expense") {
        totalExpenses += amt;
      } else if (r.type === "refund" || r.status === "refunded") {
        totalRefunds += amt;
      }
    });

    const netProfit = totalRevenue - totalExpenses - totalRefunds;

    return NextResponse.json({
      success: true,
      records,
      summary: {
        totalRevenue,
        totalExpenses,
        pendingBalances,
        totalRefunds,
        netProfit,
        totalTransactions: records.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching finances:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial data", details: error.message },
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
      type = "revenue",
      title,
      amount,
      currency = "INR",
      studentId = null,
      studentName = null,
      courseId = null,
      courseTitle = null,
      status = "completed",
      paymentMethod = "Online",
      invoiceNumber,
      notes = "",
    } = body;

    if (!title || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "Title and amount are required" },
        { status: 400 }
      );
    }

    const newRecord = {
      type,
      title,
      amount: Number(amount),
      currency,
      studentId,
      studentName,
      courseId,
      courseTitle,
      status,
      paymentMethod,
      invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      notes,
      createdAt: new Date(),
    };

    const docRef = await (adminDb as any).collection("finances").add(newRecord);

    return NextResponse.json(
      {
        success: true,
        message: "Financial record added successfully",
        record: { id: docRef.id, ...newRecord },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating financial record:", error);
    return NextResponse.json(
      { error: "Failed to save record", details: error.message },
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
      return NextResponse.json({ error: "Record ID required" }, { status: 400 });
    }

    await (adminDb as any).collection("finances").doc(id).delete();

    return NextResponse.json({ success: true, message: "Record deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete record", details: error.message },
      { status: 500 }
    );
  }
}

