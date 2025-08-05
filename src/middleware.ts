/* eslint-disable no-console */

import { NextRequest, NextResponse } from "next/server";

import { validatePassword } from "@/actions/password";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过不需要认证的路径
  if (canSkipAuth(pathname)) {
    return NextResponse.next();
  }

  const passwordMode = process.env.PASSWORD_MODE ?? "local";
  // 如果不需要认证，直接放行
  if (passwordMode === "local") {
    return NextResponse.next();
  }

  // Get password from cookie instead of Authorization header
  const mcAuthToken = request.cookies.get("mc-auth-token")?.value;

  if (passwordMode === "env") {
    const { success } = validatePassword(mcAuthToken);
    if (success) {
      return NextResponse.next();
    } else {
      // 重定向到登录页面
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If we reach here, the password mode is not supported
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

// 判断是否需要跳过认证的路径
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
    "/register",
    "/api/login",
    "/api/register",
    "/api/logout",
    "/api/server-config",
  ];

  return skipPaths.some((path) => pathname.startsWith(path));
}

// 配置middleware匹配规则
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/login|api/register|api/logout|api/server-config).*)",
  ],
};
