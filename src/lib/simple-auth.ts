/**
 * Simple authentication for single user
 * Password stored in data/user-data.json
 */

import bcrypt from "bcryptjs";

import { readUserData, writeUserData } from "./file-storage";

const SALT_ROUNDS = 10;

/**
 * Check if password has been set
 */
export async function isPasswordSet(): Promise<boolean> {
  const data = await readUserData();
  return !!data.password_hash && data.password_hash.length > 0;
}

/**
 * Set/update the password
 */
export async function setPassword(password: string): Promise<void> {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const data = await readUserData();
  data.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  await writeUserData(data);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const data = await readUserData();

  if (!data.password_hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, data.password_hash);
  } catch {
    return false;
  }
}

/**
 * Change password (requires old password verification)
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  // Verify old password
  const isValid = await verifyPassword(oldPassword);
  if (!isValid) {
    return { success: false, error: "当前密码不正确" };
  }

  // Set new password
  try {
    await setPassword(newPassword);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "修改密码失败",
    };
  }
}
