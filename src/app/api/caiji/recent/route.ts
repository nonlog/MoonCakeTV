import { NextRequest, NextResponse } from "next/server";

import {
  CaijiClient,
  getEnabledSources,
  loadSourcesFromSettings,
  normalizeVod,
} from "@/lib/caiji";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Load sources from user settings first
  await loadSourcesFromSettings();

  const searchParams = request.nextUrl.searchParams;
  const hours = parseInt(searchParams.get("hours") || "24");
  const limit = parseInt(searchParams.get("limit") || "20");
  const shuffle = searchParams.get("shuffle") !== "false"; // Default: shuffle for random effect

  // Get first enabled source
  const sources = getEnabledSources();
  const source = sources[0];

  if (!source) {
    return NextResponse.json(
      { code: 500, message: "No sources available" },
      { status: 500 }
    );
  }

  try {
    const client = new CaijiClient(source);
    const response = await client.getRecent(hours);

    if (response.code !== 1) {
      return NextResponse.json(
        { code: 500, message: `API error: ${response.msg}` },
        { status: 500 }
      );
    }

    let items = response.list.map((vod) => normalizeVod(vod, source.key));

    // Shuffle for "random" effect if requested
    if (shuffle) {
      items = items.sort(() => Math.random() - 0.5);
    }

    // Limit results
    items = items.slice(0, limit);

    return NextResponse.json({
      code: 200,
      data: {
        source: source.key,
        sourceName: source.name,
        hours,
        items,
      },
    });
  } catch (error) {
    console.error("Failed to fetch recent videos:", error);
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
