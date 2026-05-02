import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/superadmin",
    "/student",
  ];

  // Routes that are public (no auth required)
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google",
    "/api/auth/logout",
    "/api/auth/student-login",
    "/api/auth/student-register",
    "/blocked",
  ];

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
  if (isPublicRoute) return NextResponse.next();

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute) {
    // Get the token from cookies
    const token = request.cookies.get("authToken")?.value;

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Parse full userData cookie to check role and blocked status
    const userDataCookie = request.cookies.get("userData")?.value;
    let userData: { role?: string; isBlocked?: boolean } = {};

    if (userDataCookie) {
      try {
        userData = JSON.parse(userDataCookie);
      } catch {
        // Invalid cookie — clear and redirect
        const res = NextResponse.redirect(new URL("/", request.url));
        res.cookies.delete("userData");
        res.cookies.delete("role");
        return res;
      }
    }

    // If user is blocked, redirect to blocked page
    if (userData.isBlocked === true) {
      return NextResponse.redirect(new URL("/blocked", request.url));
    }

    const role = userData.role || request.cookies.get("role")?.value;

    // Role-based route protection
    if (pathname.startsWith("/dashboard") && role !== "admin" && role !== "user" && role !== "trainer") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/superadmin") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/student") && role !== "student") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (publicly accessible files like images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
