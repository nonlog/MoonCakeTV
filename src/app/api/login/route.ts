import { NextRequest, NextResponse } from "next/server";

import { isFirstUser } from "@/lib/file-storage";
import {
  createUser,
  generateAuthToken,
  verifyCredentials,
} from "@/lib/simple-auth";

import { AUTH_CONSTANTS, HTTP_STATUS } from "@/config/constants";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * POST /api/login
 * Multi-user authentication with username and password
 * If this is the first user, they will be created as admin
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

    // Check if this is the first user
    const firstUser = await isFirstUser();

    if (firstUser) {
      // First user - create admin account
      const result = await createUser(username, password);

      if (!result.success) {
        return NextResponse.json(
          {
            code: HTTP_STATUS.BAD_REQUEST,
            data: { success: false },
            message: result.error || "创建用户失败",
          },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      // Generate token for the new admin user
      const token = await generateAuthToken({
        username,
        role: result.role!,
      });

      const response = NextResponse.json({
        code: HTTP_STATUS.OK,
        data: { success: true, role: result.role },
        message: `欢迎，管理员 ${username}！`,
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
    }

    // Not first user - verify credentials
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

    const response = NextResponse.json({
      code: HTTP_STATUS.OK,
      data: { success: true, role: authPayload.role },
      message: `欢迎回来，${username}！`,
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
