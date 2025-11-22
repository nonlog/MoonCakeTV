import { NextResponse } from "next/server";

// Force Node.js runtime for consistency
export const runtime = "nodejs";

export function GET() {
  const serverConfig = {
    // Simple auth: either disabled (public) or enabled (password required)
    authDisabled: process.env.DISABLE_AUTH === "true",
  };

  return NextResponse.json({
    code: 200,
    data: serverConfig,
    message: "ok",
  });
}
