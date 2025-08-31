import { NextRequest, NextResponse } from "next/server";

import { createUser } from "@/utils/user";

export async function POST(req: NextRequest) {
  // Check if PASSWORD_MODE is db
  if (process.env.PASSWORD_MODE !== "db") {
    return NextResponse.json({
      code: 400,
      data: { success: false },
      message: "注册功能仅在数据库模式下可用",
    });
  }

  const body = await req.json();
  const { username, password, email } = body;

  // Basic validation
  if (!username || !password) {
    return NextResponse.json({
      code: 400,
      data: { success: false },
      message: "用户名和密码不能为空",
    });
  }

  if (password.length < 6) {
    return NextResponse.json({
      code: 400,
      data: { success: false },
      message: "密码长度至少为6位",
    });
  }

  try {
    const authResult = await createUser(username, password, email);

    if (!authResult.success) {
      return NextResponse.json({
        code: 400,
        data: { success: false },
        message: authResult.error,
      });
    }

    return NextResponse.json({
      code: 200,
      data: { success: true },
      message: "注册成功",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({
      code: 500,
      data: { success: false },
      message: "服务器错误，请重试",
    });
  }
}
