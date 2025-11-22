import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication for certain paths
  if (canSkipAuth(pathname)) {
    return NextResponse.next();
  }

  // Check if password protection is disabled via env var
  // DISABLE_AUTH=true means open/public mode (no password required)
  if (process.env.DISABLE_AUTH === "true") {
    return NextResponse.next();
  }

  // Check for JWT token
  const token = request.cookies.get("mc-auth-token")?.value;

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT token
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default-secret-change-me",
    );
    const { payload } = await jwtVerify(token, secret);

    // Token is valid, add user info to request headers
    const response = NextResponse.next();
    response.headers.set("x-user-username", (payload.username as string) || "");
    response.headers.set("x-user-role", (payload.role as string) || "user");

    return response;
  } catch {
    // Token is invalid or expired, redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Paths that don't require authentication
 */
function canSkipAuth(pathname: string): boolean {
  const skipPaths = [
    // Static files
    "/_next",
    "/favicon.ico",
    "/robots.txt",
    "/manifest.json",
    "/icons/",
    "/logo.png",
    "/screenshot.png",
    // Auth-related pages and API routes
    "/login",
    "/api/login",
    "/api/logout",
    "/api/server-config",
  ];

  return skipPaths.some((path) => pathname.startsWith(path));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/login|api/logout|api/server-config).*)",
  ],
};
