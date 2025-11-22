import { NextRequest, NextResponse } from "next/server";

import { isFirstUser } from "@/lib/file-storage";
import { createUser } from "@/lib/simple-auth";

import { HTTP_STATUS } from "@/config/constants";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * POST /api/signup
 * Create a new user account
 * First user is automatically assigned admin role
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
    console.log(`[Signup] Is first user? ${firstUser}, username: ${username}`);

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
