import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-context";
import { deleteUser, listUsers } from "@/lib/file-storage";

import { HTTP_STATUS } from "@/config/constants";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * GET /api/admin/users
 * Admin-only endpoint to list all users
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin access
    requireAdmin(req);

    const users = await listUsers();

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: users,
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

    console.error("List users error:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "服务器错误，请重试",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

/**
 * DELETE /api/admin/users
 * Admin-only endpoint to delete a user
 */
export async function DELETE(req: NextRequest) {
  try {
    // Require admin access
    const admin = requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          message: "用户名不能为空",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Prevent admin from deleting themselves
    if (username === admin.username) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          message: "不能删除自己的账户",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const success = await deleteUser(username);

    if (!success) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.NOT_FOUND,
          message: "用户不存在",
        },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      message: `用户 ${username} 已删除`,
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

    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "服务器错误，请重试",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
