import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

import { AUTH_CONSTANTS, HTTP_STATUS } from "@/config/constants";
import { isPasswordSet, setPassword, verifyPassword } from "@/lib/simple-auth";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * POST /api/login
 * Simple password-only authentication
 * If no password is set, this will set it (first-time setup)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          data: { success: false },
          message: "密码不能为空",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Check if password is already set
    const passwordExists = await isPasswordSet();

    if (!passwordExists) {
      // First time setup - set the password
      try {
        await setPassword(password);
        // Password set successfully, continue to generate token
      } catch (error) {
        return NextResponse.json(
          {
            code: HTTP_STATUS.BAD_REQUEST,
            data: { success: false },
            message: error instanceof Error ? error.message : "密码设置失败",
          },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }
    } else {
      // Password exists - verify it
      const isValid = await verifyPassword(password);

      if (!isValid) {
        return NextResponse.json(
          {
            code: HTTP_STATUS.UNAUTHORIZED,
            data: { success: false },
            message: "密码错误",
          },
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
    }

    // Create JWT token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default-secret-change-me",
    );
    const token = await new SignJWT({ authenticated: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(AUTH_CONSTANTS.JWT_EXPIRATION)
      .sign(secret);

    const response = NextResponse.json({
      code: HTTP_STATUS.OK,
      data: { success: true },
      message: "欢迎回来",
    });

    // Set HTTP-only cookie
    response.cookies.set("mc-auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
