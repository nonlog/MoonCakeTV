import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
    if (error instanceof ZodError) {
      return {
        success: false,
        error: `服务器错误: ${fromZodError(error).message}`,
      };
    }
    return {
      success: false,
      error: `服务器错误: ${(error as Error).message}`,
    };
  } finally {
    client.release();
  }
}

export async function createUser(
  username: string,
  password: string,
  email?: string,
): Promise<AuthResult> {
  const client = await pool.connect();

  try {
    // Check if username already exists
    const existingUser = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );

    if (existingUser.rows.length > 0) {
      return { success: false, error: "用户名已存在" };
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email],
      );

      if (existingEmail.rows.length > 0) {
        return { success: false, error: "邮箱已被使用" };
      }
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (username, password_hash, email, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [username, passwordHash, email || null, "user"],
    );

    const user = user_schema.parse(result.rows[0]);

    // Create user_data entry
    await client.query("INSERT INTO user_data (user_id) VALUES ($1)", [
      user.id,
    ]);

    return {
      success: true,
      user,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: `服务器错误: ${fromZodError(error).message}`,
      };
    }
    return {
      success: false,
      error: `服务器错误: ${(error as Error).message}`,
    };
  } finally {
    client.release();
  }
}
