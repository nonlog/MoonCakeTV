import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-context";
import { createUser } from "@/lib/simple-auth";

import { HTTP_STATUS } from "@/config/constants";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * POST /api/admin/create-user
 * Admin-only endpoint to create new users
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin access
    requireAdmin(req);

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          message: "用户名和密码不能为空",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Create the user
    const result = await createUser(username, password, true);

    if (!result.success) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          message: result.error || "创建用户失败",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: {
        username,
        role: result.role,
      },
      message: `用户 ${username} 创建成功`,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          {
            code: HTTP_STATUS.UNAUTHORIZED,
            message: "未授权",
          },
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json(
          {
            code: HTTP_STATUS.FORBIDDEN,
            message: "需要管理员权限",
          },
          { status: HTTP_STATUS.FORBIDDEN },
        );
      }
    }

    console.error("Create user error:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "服务器错误，请重试",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
