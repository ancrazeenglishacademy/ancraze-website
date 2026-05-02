import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

interface TrainerLoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrainerLoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and Password are required" },
        { status: 400 }
      );
    }

    // Check if Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: "Login service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Find user in Firestore with this email
    const userSnapshot = await (adminDb as any)
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify role is trainer
    if (userData.role !== "trainer") {
      return NextResponse.json(
        { error: "Access denied: Not a trainer account" },
        { status: 403 }
      );
    }

    // Check if trainer is blocked
    if (userData.isBlocked === true) {
      return NextResponse.json(
        { error: "Your account has been blocked. Please contact support." },
        { status: 403 }
      );
    }

    const uid = userData.uid;

    // Authenticate using Firebase REST API with loginId as password
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Firebase API key not configured" },
        { status: 500 }
      );
    }

    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: password,
          returnSecureToken: true,
        }),
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      console.error("Firebase REST API error:", authData);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const idToken = authData.idToken;

    // Build user payload
    const userPayload = {
      uid,
      email: authData.email,
      fullName: userData.fullName || "",
      loginId: userData.loginId || null,
      role: "trainer",
      isBlocked: userData.isBlocked || false,
      photoURL: userData.photoURL || null,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Trainer Login successful",
        user: userPayload,
        idToken,
      },
      { status: 200 }
    );

    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    };

    response.cookies.set("userData", JSON.stringify(userPayload), cookieOptions);
    response.cookies.set("authToken", idToken, { ...cookieOptions, httpOnly: true });
    response.cookies.set("role", "trainer", cookieOptions);
    response.cookies.set("uid", uid, { ...cookieOptions, httpOnly: true });
    response.cookies.set("fullName", userData.fullName || "", cookieOptions);
    response.cookies.set("email", authData.email || "", cookieOptions);

    return response;
  } catch (error: any) {
    console.error("Trainer login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
