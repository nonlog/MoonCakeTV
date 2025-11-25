import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_SOURCES,
  parseSourcesFromText,
  setSourcesCache,
  sourcesToText,
} from "@/lib/caiji";
import { getSettings, updateSettings } from "@/lib/file-storage";
import { getUsernameFromToken } from "@/lib/simple-auth";

export const dynamic = "force-dynamic";

const SOURCES_KEY = "caiji_sources";

/**
 * GET /api/caiji/sources
 * Returns the user's configured sources as text
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mc-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { code: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const username = await getUsernameFromToken(token);
    if (!username) {
      return NextResponse.json(
        { code: 401, message: "Invalid token" },
        { status: 401 }
      );
    }

    const settings = await getSettings(username);
    const sourcesText = (settings[SOURCES_KEY] as string) || "";

    // If no custom sources, return default as text
    const displayText = sourcesText || sourcesToText(DEFAULT_SOURCES);

    // Parse and cache for other API routes
    const sources = sourcesText
      ? parseSourcesFromText(sourcesText)
      : DEFAULT_SOURCES;
    setSourcesCache(sources);

    return NextResponse.json({
      code: 200,
      data: {
        sourcesText: displayText,
        sources,
      },
    });
  } catch (error) {
    console.error("Failed to get sources:", error);
    return NextResponse.json(
      { code: 500, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/caiji/sources
 * Save user's source configuration
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mc-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { code: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const username = await getUsernameFromToken(token);
    if (!username) {
      return NextResponse.json(
        { code: 401, message: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sourcesText } = body as { sourcesText: string };

    if (typeof sourcesText !== "string") {
      return NextResponse.json(
        { code: 400, message: "sourcesText must be a string" },
        { status: 400 }
      );
    }

    // Parse to validate
    const sources = parseSourcesFromText(sourcesText);

    // Save to settings
    await updateSettings(username, { [SOURCES_KEY]: sourcesText });

    // Update cache
    setSourcesCache(sources);

    return NextResponse.json({
      code: 200,
      message: "Sources saved successfully",
      data: {
        sources,
      },
    });
  } catch (error) {
    console.error("Failed to save sources:", error);
    return NextResponse.json(
      { code: 500, message: "Internal server error" },
      { status: 500 }
    );
  }
}
