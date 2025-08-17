import { NextRequest, NextResponse } from "next/server";

import { verifyJwt } from "@/utils/jwt";
import { redisClient } from "@/utils/redis";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    code: 200,
    data: {
      success: true,
    },
    message: "已退出登录",
  });

  // Get the auth token from cookies
  const mc_auth_token = request.cookies.get("mc-auth-token")?.value;

  // If it's a JWT token (database mode), extract JTI and blacklist it
  if (mc_auth_token && process.env.PASSWORD_MODE === "db") {
    try {
      const verifed_jwt_data = await verifyJwt(mc_auth_token);
      if (verifed_jwt_data?.jti) {
        await redisClient?.setex(
          `logout:jti:${verifed_jwt_data.jti}`,
          60 * 60 * 24 * 180,
          "1",
        );
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  // Clear the auth cookie
  response.cookies.set("mc-auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
}
