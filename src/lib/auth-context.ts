/**
 * Auth context utilities for API routes
 * Extract user info from request headers set by middleware
 */

import { NextRequest } from "next/server";

import type { UserRole } from "./file-storage";

export interface AuthContext {
  username: string;
  role: UserRole;
  isAdmin: boolean;
}

/**
 * Get authenticated user from request headers
 * Returns null if not authenticated (should not happen after middleware)
 */
export function getAuthUser(request: NextRequest): AuthContext | null {
  const username = request.headers.get("x-user-username");
  const role = request.headers.get("x-user-role") as UserRole;

  if (!username || !role) {
    return null;
  }

  return {
    username,
    role,
    isAdmin: role === "admin",
  };
}

/**
 * Require authenticated user (throws error if not found)
 */
export function requireAuth(request: NextRequest): AuthContext {
  const user = getAuthUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require admin user (throws error if not admin)
 */
export function requireAdmin(request: NextRequest): AuthContext {
  const user = requireAuth(request);
  if (!user.isAdmin) {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}
