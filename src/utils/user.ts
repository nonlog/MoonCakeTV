import bcrypt from "bcryptjs";

import { pool } from "@/utils/pg";

import { signJwt } from "./jwt";
import { User, user_schema } from "../schemas/user";

export type AuthResult = {
  success: boolean;
  user?: User;
  jwt_token?: string;
  jti?: string;
  error?: string;
};

export function authenticateWithEnv(password: string): AuthResult {
  const isValidated = password === process.env.MY_PASSWORD?.trim();
  return {
    success: isValidated,
    error: isValidated ? undefined : "密码错误",
  };
}

export async function authenticateWithDatabase(
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
