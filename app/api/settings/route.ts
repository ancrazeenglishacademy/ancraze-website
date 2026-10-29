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

const DEFAULT_SETTINGS = {
  academyName: "Ancraze English Academy",
  academyTagline: "Precision English Learning Platform",
  brandColor: "#2A0066",
  contactEmail: "support@ancraze.com",
  contactPhone: "+91 98765 43210",
  address: "Bangalore, Karnataka, India",
  studentIdPrefix: "ANC",
  currencySymbol: "₹",
  maxActiveDevicesPerStudent: 1,
  maintenanceMode: false,
  allowNewRegistrations: true,
  emailNotifications: true,
  smsNotifications: false,
};

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
    if (!adminDb) {
      return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
    }

    const doc = await (adminDb as any).collection("config").doc("academy").get();
    if (!doc.exists) {
      return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
    }

    return NextResponse.json({
      success: true,
      settings: { ...DEFAULT_SETTINGS, ...doc.data() },
    });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
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
    const updatedSettings = {
      ...body,
      updatedAt: new Date(),
    };

    await (adminDb as any)
      .collection("config")
      .doc("academy")
      .set(updatedSettings, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Academy settings saved successfully",
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings", details: error.message },
      { status: 500 }
    );
  }
}

