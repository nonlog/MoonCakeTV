import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

import { User, user_schema } from "@/schemas/user";
import { signJwt } from "@/utils/jwt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type AuthResult = {
  success: boolean;
  user?: User;
  jwt_token?: string;
  jti?: string;
  error?: string;
};

function authenticateWithEnv(password: string): AuthResult {
  const isValidated = password === process.env.MY_PASSWORD?.trim();
  return {
    success: isValidated,
    error: isValidated ? undefined : "密码错误",
  };
}

async function authenticateWithDatabase(
  username: string,
  password: string,
): Promise<AuthResult> {
  const client = await pool.connect();

  try {
    // Query user from database
    const result = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );

    const user_item = result.rows[0];
    if (!user_item) {
      return { success: false, error: "用户名或密码错误" };
    }

    const user = user_schema.parse(user_item);
    const storedHash = user.password_hash;
    const isValidated = await bcrypt.compare(password, storedHash);

    if (!isValidated) {
      return { success: false, error: "用户名或密码错误" };
    }

    const [jwt_token, jti] = await signJwt({
      id: user.id,
      username: user.username,
    });

    if (!jwt_token || !jti) {
      return { success: false, error: "服务器错误: jti or jwt_token is null" };
    }

    return {
      success: true,
      user,
      jwt_token,
      jti,
    };
  } catch (error) {
    return {
      success: false,
      error: `服务器错误: ${(error as Error).message}`,
    };
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, username } = body;

  let authResult: AuthResult;

  if (process.env.PASSWORD_MODE === "env") {
    authResult = authenticateWithEnv(password);
  } else if (process.env.PASSWORD_MODE === "db") {
    authResult = await authenticateWithDatabase(username, password);
  } else {
    return NextResponse.json({
      code: 400,
      data: { success: false },
      message: "Invalid PASSWORD_MODE configuration",
    });
  }

  const mc_auth_token =
    process.env.PASSWORD_MODE === "env"
      ? process.env.MY_PASSWORD
      : authResult.jwt_token;

  if (!authResult.success || !mc_auth_token) {
    const statusCode = authResult.error?.includes("服务器错误") ? 500 : 400;
    return NextResponse.json({
      code: statusCode,
      data: { success: false },
      message: authResult.error,
    });
  }

  const response = NextResponse.json({
    code: 200,
    data: {
      success: true,
    },
    message: "欢迎回来",
  });

  // Set HTTP-only cookie for authentication
  response.cookies.set("mc-auth-token", mc_auth_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180, // 180 days
    path: "/",
  });

  return response;
}
