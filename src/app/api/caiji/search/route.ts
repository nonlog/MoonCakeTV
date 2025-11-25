import { NextRequest, NextResponse } from "next/server";

import {
  CaijiClient,
  getEnabledSources,
  getSourceByKey,
  loadSourcesFromSettings,
  normalizeVod,
} from "@/lib/caiji";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Load sources from user settings first
  await loadSourcesFromSettings();

  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");
  const page = parseInt(searchParams.get("page") || "1");
  const sourceKey = searchParams.get("source"); // Optional: filter by specific source

  if (!keyword) {
    return NextResponse.json(
      { code: 400, message: "keyword is required" },
      { status: 400 }
    );
  }

  // Get sources to search
  const sources = sourceKey
    ? [getSourceByKey(sourceKey)].filter(Boolean)
    : getEnabledSources();

  if (sources.length === 0) {
    return NextResponse.json(
      { code: 404, message: "No sources available" },
      { status: 404 }
    );
  }

  // Search all sources concurrently
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const client = new CaijiClient(source!);
      const response = await client.search(keyword, page);

      if (response.code !== 1) {
        throw new Error(`Source ${source!.key} returned error: ${response.msg}`);
      }

      return {
        source: source!.key,
        sourceName: source!.name,
        total: response.total,
        pagecount: response.pagecount,
        items: response.list.map((vod) => normalizeVod(vod, source!.key)),
      };
    })
  );

  // Collect successful results
  const successResults = results
    .filter(
      (r): r is PromiseFulfilledResult<{
        source: string;
        sourceName: string;
        total: number;
        pagecount: number;
        items: ReturnType<typeof normalizeVod>[];
      }> => r.status === "fulfilled"
    )
    .map((r) => r.value);

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

  return NextResponse.json({
    code: 200,
    data: {
      keyword,
      page,
      results: successResults,
    },
  });
}
