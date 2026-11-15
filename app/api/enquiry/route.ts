import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, course, message } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full Name and Phone Number are required." },
        { status: 400 }
      );
    }

    if (adminDb) {
      await (adminDb as any).collection("enquiries").add({
        fullName: fullName.trim(),
        phone: phone.trim(),
        course: course || "General Inquiry",
        message: message ? message.trim() : "",
        createdAt: admin.firestore.Timestamp.now(),
        status: "new",
        source: "homepage_quick_enquiry",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry submitted successfully! Our team will contact you shortly.",
    });
  } catch (error: any) {
    console.error("Error submitting enquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit enquiry. Please try again." },
      { status: 500 }
    );
  }
}
