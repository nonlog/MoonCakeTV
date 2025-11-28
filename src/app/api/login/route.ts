import { NextRequest, NextResponse } from "next/server";

import { generateAuthToken, verifyCredentials } from "@/lib/simple-auth";

import { AUTH_CONSTANTS, HTTP_STATUS } from "@/config/constants";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * POST /api/login
 * Multi-user authentication with username and password
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          data: { success: false },
          message: "用户名和密码不能为空",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Verify credentials
    const authPayload = await verifyCredentials(username, password);

    if (!authPayload) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.UNAUTHORIZED,
          data: { success: false },
          message: "用户名或密码错误",
        },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    // Generate JWT token
    const token = await generateAuthToken(authPayload);

    // Create JSON response
    const response = NextResponse.json({
      code: HTTP_STATUS.OK,
      data: { success: true },
      message: "登录成功",
    });

    // Set HTTP-only cookie
    // For NAS/internal network: set ALLOW_HTTP_COOKIES=1 to allow cookies over HTTP
    const allowHttpCookies = process.env.ALLOW_HTTP_COOKIES === "1";
    const useSecureCookies =
      process.env.NODE_ENV === "production" && !allowHttpCookies;

    response.cookies.set("mc-auth-token", token, {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      maxAge: AUTH_CONSTANTS.COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: { success: false },
        message: "服务器错误，请重试",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
