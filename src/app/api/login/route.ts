import { NextRequest, NextResponse } from "next/server";

export function GET() {
  const loginConfig = {
    PASSWORD_MODE: process.env.PASSWORD_MODE,
  };

  return NextResponse.json({
    code: 200,
    data: loginConfig,
    message: "ok",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password } = body;

  if (process.env.PASSWORD_MODE === "env") {
    const isValidated = password === process.env.MY_PASSWORD;
    if (isValidated) {
      const response = NextResponse.json({
        code: 200,
        data: {
          success: true,
        },
        message: "欢迎回来",
      });

      // Set HTTP-only cookie for authentication
      response.cookies.set("mc-auth-token", password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 180, // 180 days
        path: "/",
      });

      return response;
    }
    return NextResponse.json({
      code: 400,
      data: {
        success: false,
      },
      message: "密码错误",
    });
  }

  return NextResponse.json({
    code: 400,
    data: {
      success: false,
    },
    message: "不支持的认证模式",
  });
}
