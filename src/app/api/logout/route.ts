import { NextResponse } from "next/server";

import { HTTP_STATUS } from "@/config/constants";

/**
 * POST /api/logout
 * Simple logout - just clear the cookie
 */
export async function POST() {
  const response = NextResponse.json({
    code: HTTP_STATUS.OK,
    data: { success: true },
    message: "已退出登录",
  });

  // Clear the auth cookie
  response.cookies.set("mc-auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
}
