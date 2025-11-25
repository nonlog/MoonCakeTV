import { NextRequest, NextResponse } from "next/server";

import { isFirstUser } from "@/lib/file-storage";
import { createUser } from "@/lib/simple-auth";

import { HTTP_STATUS } from "@/config/constants";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * GET /api/signup
 * Check if signup is available (only when no admin exists)
 */
export async function GET() {
  const firstUser = await isFirstUser();

  if (!firstUser) {
    return NextResponse.json(
      {
        code: HTTP_STATUS.NOT_FOUND,
        data: { available: false },
        message: "注册已关闭",
      },
      { status: HTTP_STATUS.NOT_FOUND },
    );
  }

  return NextResponse.json({
    code: HTTP_STATUS.OK,
    data: { available: true },
    message: "注册开放中",
  });
}

/**
 * POST /api/signup
 * Create a new user account
 * Only available when no admin exists (first user becomes admin)
 * Returns 404 when admin already exists
 */
export async function POST(req: NextRequest) {
  try {
    // Check if this is the first user (no admin exists yet)
    const firstUser = await isFirstUser();

    // If admin already exists, signup is disabled - return 404
    if (!firstUser) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.NOT_FOUND,
          data: { success: false },
          message: "注册已关闭",
        },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

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

    console.log(`[Signup] Creating first admin user: ${username}`);

    // Create the user
    const result = await createUser(username, password);

    if (!result.success) {
      console.error(`[Signup] Failed to create user: ${result.error}`);
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          data: { success: false },
          message: result.error || "注册失败",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    console.log(`[Signup] User created successfully with role: ${result.role}`);

    // Return success response (client will redirect to login)
    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: { success: true },
      message: "注册成功，请登录",
    });
  } catch (error) {
    console.error("Signup error:", error);
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
