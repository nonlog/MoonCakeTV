import { NextRequest, NextResponse } from "next/server";

import { AuthResult } from "@/utils/user";
import { authenticateWithEnv } from "@/utils/user";
import { authenticateWithDatabase } from "@/utils/user";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, username } = body;

  let authResult: AuthResult;

  if (process.env.PASSWORD_MODE === "env") {
    authResult = authenticateWithEnv(password);
  } else if (process.env.PASSWORD_MODE === "db") {
    authResult = await authenticateWithDatabase(username, password);
  } else {
    return NextResponse.json({
      code: 400,
      data: { success: false },
      message: "Invalid PASSWORD_MODE configuration",
    });
  }

  const mc_auth_token =
    process.env.PASSWORD_MODE === "env"
      ? process.env.MY_PASSWORD
      : authResult.jwt_token;

  if (!authResult.success || !mc_auth_token) {
    const statusCode = authResult.error?.includes("服务器错误") ? 500 : 400;
    return NextResponse.json({
      code: statusCode,
      data: { success: false },
      message: authResult.error,
    });
  }

  const response = NextResponse.json({
    code: 200,
    data: {
      success: true,
    },
    message: "欢迎回来",
  });

  // Set HTTP-only cookie for authentication
  response.cookies.set("mc-auth-token", mc_auth_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180, // 180 days
    path: "/",
  });

  return response;
}
