import { NextRequest, NextResponse } from "next/server";

import {
  CaijiClient,
  getSourceByKey,
  loadSourcesFromSettings,
  normalizeVod,
} from "@/lib/caiji";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Load sources from user settings first
  await loadSourcesFromSettings();

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id"); // Format: sourceKey_vodId

  if (!id) {
    return NextResponse.json(
      { code: 400, message: "id is required" },
      { status: 400 },
    );
  }

  // Parse ID format: sourceKey_vodId
  const underscoreIndex = id.indexOf("_");
  if (underscoreIndex === -1) {
    return NextResponse.json(
      { code: 400, message: "Invalid id format. Expected: sourceKey_vodId" },
      { status: 400 },
    );
  }

  const sourceKey = id.substring(0, underscoreIndex);
  const vodIdStr = id.substring(underscoreIndex + 1);
  const vodId = parseInt(vodIdStr);

  if (isNaN(vodId)) {
    return NextResponse.json(
      { code: 400, message: "Invalid vodId in id" },
      { status: 400 },
    );
  }

  // Find the source
  const source = getSourceByKey(sourceKey);
  if (!source) {
    return NextResponse.json(
      { code: 404, message: `Source not found: ${sourceKey}` },
      { status: 404 },
    );
  }

  try {
    const client = new CaijiClient(source);
    const response = await client.getDetail(vodId);

    if (response.code !== 1) {
      return NextResponse.json(
        { code: 500, message: `API error: ${response.msg}` },
        { status: 500 },
      );
    }

    if (!response.list || response.list.length === 0) {
      return NextResponse.json(
        { code: 404, message: "Video not found" },
        { status: 404 },
      );
    }

    const vod = response.list[0];
    const normalized = normalizeVod(vod, sourceKey);

    return NextResponse.json({
      code: 200,
      data: normalized,
    });
  } catch (error) {
    console.error(`Failed to fetch detail for ${id}:`, error);
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
