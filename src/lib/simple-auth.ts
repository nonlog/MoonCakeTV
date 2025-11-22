/**
 * Multi-user authentication
 * Each user has their own {username}.json file
 */

import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

import {
  isFirstUser,
  readUserData,
  userExists,
  type UserRole,
  writeUserData,
} from "./file-storage";

const SALT_ROUNDS = 10;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production",
);

export interface AuthPayload {
  username: string;
  role: UserRole;
}

/**
 * Verify username and password
 * Returns user info if valid, null if invalid
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<AuthPayload | null> {
  // Check if user exists
  const exists = await userExists(username);
  if (!exists) {
    return null; // User doesn't exist
  }

  // Read user data
  const data = await readUserData(username);

  // Verify password
  if (!data.password_hash) {
    return null;
  }

  try {
    const isValid = await bcrypt.compare(password, data.password_hash);
    if (!isValid) {
      return null;
    }

    // Return user info
    return {
      username,
      role: data.role || "user",
    };
  } catch {
    return null;
  }
}

/**
 * Create a new user
 * First user is automatically admin
 */
export async function createUser(
  username: string,
  password: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _createdByAdmin = false,
): Promise<{ success: boolean; error?: string; role?: UserRole }> {
  // Validate username
  if (!username || username.length < 3) {
    return { success: false, error: "用户名至少需要3个字符" };
  }

  // Validate password
  if (!password || password.length < 6) {
    return { success: false, error: "密码至少需要6个字符" };
  }

  // Check if user already exists
  const exists = await userExists(username);
  if (exists) {
    return { success: false, error: "用户名已存在" };
  }

  // Determine role: first user is admin, others are regular users
  const firstUser = await isFirstUser();
  const role: UserRole = firstUser ? "admin" : "user";

  // Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user data
  await writeUserData(username, {
    password_hash,
    role,
    bookmarks: [],
    watch_history: [],
    settings: {},
  });

  return { success: true, role };
}

/**
 * Change password for a user
 */
export async function changePassword(
  username: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  // Verify old password
  const valid = await verifyCredentials(username, oldPassword);
  if (!valid) {
    return { success: false, error: "当前密码不正确" };
  }

  // Validate new password
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "新密码至少需要6个字符" };
  }

  // Update password
  const data = await readUserData(username);
  data.password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await writeUserData(username, data);

  return { success: true };
}

/**
 * Generate JWT token
 */
export async function generateAuthToken(payload: AuthPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify JWT token
 */
export async function verifyAuthToken(
  token: string,
): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(username: string): Promise<boolean> {
  const data = await readUserData(username);
  return data.role === "admin";
}
