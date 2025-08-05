import { NextResponse } from "next/server";

export function GET() {
  const serverConfig = {
    PASSWORD_MODE: process.env.PASSWORD_MODE,
  };

  return NextResponse.json({
    code: 200,
    data: serverConfig,
    message: "ok",
  });
}
