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

  // Get all enabled sources
  const sources = getEnabledSources();

  if (sources.length === 0) {
    return NextResponse.json(
      { code: 500, message: "No sources available" },
      { status: 500 }
    );
  }

  // Fetch from all sources concurrently
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const client = new CaijiClient(source);
      const response = await client.getRecent(hours);

      if (response.code !== 1) {
        throw new Error(`Source ${source.key} returned error: ${response.msg}`);
      }

      return response.list.map((vod) => normalizeVod(vod, source.key));
    })
  );

  // Collect all items from successful sources
  let allItems = results
    .filter(
      (r): r is PromiseFulfilledResult<ReturnType<typeof normalizeVod>[]> =>
        r.status === "fulfilled"
    )
    .flatMap((r) => r.value);

  // Log failed sources for debugging
  const failedResults = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected"
  );
  if (failedResults.length > 0) {
    console.warn(
      "Some sources failed:",
      failedResults.map((r) => r.reason?.message)
    );
  }

  // Shuffle for "random" effect if requested
  if (shuffle) {
    allItems = allItems.sort(() => Math.random() - 0.5);
  }

  // Limit results
  allItems = allItems.slice(0, limit);

  return NextResponse.json({
    code: 200,
    data: {
      hours,
      items: allItems,
    },
  });
}
