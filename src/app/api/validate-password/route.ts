import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password } = body;

  const passwordMode = process.env.PASSWORD_MODE?.trim() ?? "local";

  if (passwordMode === "local") {
    return NextResponse.json({
      code: 400,
      data: {
        success: false,
      },
      message: "local模式不要使用此函数",
    });
  }

  if (passwordMode === "env") {
    const isValidated =
      !!password && process.env.MY_PASSWORD?.trim() === password;
    return NextResponse.json({
      code: 200,
      data: {
        success: isValidated,
      },
      message: `密码验证${isValidated ? "成功" : "失败"}`,
    });
  }

  if (passwordMode === "db") {
    return NextResponse.json({
      code: 400,
      data: {
        success: false,
      },
      message: "敬请稍后",
    });
  }

  return NextResponse.json({
    code: 400,
    data: {
      success: false,
    },
    message: "密码模式只有三种：local, env, db",
  });
}
