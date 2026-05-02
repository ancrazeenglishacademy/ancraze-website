import { NextRequest, NextResponse } from "next/server";

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Dynamic import to catch initialization errors
    let adminAuth, adminDb;
    try {
      const firebaseAdmin = await import("@/lib/firebaseAdmin");
      adminAuth = firebaseAdmin.adminAuth;
      adminDb = firebaseAdmin.adminDb;
    } catch (importError: any) {
      console.error("Firebase Admin Import Error:", importError);
      return NextResponse.json(
        {
          error: "Server misconfiguration: Firebase Admin SDK failed to load.",
          details: importError.message,
        },
        { status: 500 },
      );
    }

    // Check if Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error:
            "Login service temporarily unavailable. Please configure Firebase Admin SDK.",
          code: "ADMIN_SDK_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    // Authenticate using Firebase REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Firebase API key not configured" },
        { status: 500 },
      );
    }

    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      console.error("Firebase REST API error:", authData);

      if (authData.error?.message === "INVALID_EMAIL") {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }
      if (authData.error?.message === "EMAIL_NOT_FOUND") {
        return NextResponse.json(
          { error: "User not found. Please register first." },
          { status: 404 },
        );
      }
      if (authData.error?.message === "INVALID_PASSWORD" || authData.error?.message === "INVALID_LOGIN_CREDENTIALS") {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }
      if (authData.error?.message === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: authData.error?.message || "Authentication failed" },
        { status: 401 }
      );
    }

    const uid = authData.localId;
    const idToken = authData.idToken;

    // Get user data from Firestore using Admin SDK
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Check if user is blocked
    if (userData.isBlocked === true) {
      return NextResponse.json(
        { error: "Your account has been blocked. Please contact support." },
        { status: 403 },
      );
    }

    // Check if user role is "admin", "user", "student", or "superadmin"
    const userRole = userData.role || "user";
    const allowedRoles = ["admin", "user", "student", "superadmin", "trainer"];

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Unauthorized access: Invalid role." },
        { status: 401 },
      );
    }

    // Build the full user object from DB to store in cookie
    const userPayload = {
      uid,
      email: authData.email,
      fullName: userData.fullName || "",
      photoURL: userData.photoURL || null,
      role: userRole,
      isBlocked: userData.isBlocked || false,
      authProvider: userData.authProvider || "email",
      createdAt: userData.createdAt || null,
      loginId: userData.loginId || null,
      enrolledCourses: userData.enrolledCourses || [],
      deviceId: userData.deviceId || null,
      createdByAdminName: userData.createdByAdminName || null,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: userPayload,
        idToken,
      },
      { status: 200 },
    );

    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    };

    // Store full user object as JSON in a single cookie (readable by client)
    response.cookies.set("userData", JSON.stringify(userPayload), cookieOptions);

    // Set authentication cookies
    response.cookies.set("authToken", idToken, {
      ...cookieOptions,
      httpOnly: true,
    });

    response.cookies.set("role", userRole, cookieOptions);

    response.cookies.set("uid", uid, {
      ...cookieOptions,
      httpOnly: true,
    });

    response.cookies.set("fullName", userData.fullName || "", cookieOptions);
    response.cookies.set("email", authData.email || "", cookieOptions);

    if (userData.photoURL) {
      response.cookies.set("photoURL", userData.photoURL, cookieOptions);
    }

    return response;
  } catch (error: any) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 },
    );
  }
}
