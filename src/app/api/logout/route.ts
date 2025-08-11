import { NextResponse } from "next/server";

export function POST() {
  const response = NextResponse.json({
    code: 200,
    data: {
      success: true,
    },
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
