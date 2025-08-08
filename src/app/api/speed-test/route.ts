import { NextRequest, NextResponse } from "next/server";

import {
  BYTES_TO_FETCH,
  fetchText,
  headPing,
  measureSpeed,
  parseVariantResolution,
  pickFirstSegmentUrlFromMediaPlaylist,
  pickFirstVariantPlaylistUrl,
  REQUEST_TIMEOUT_MS,
  SpeedTestResult,
  withTimeout,
} from "@/utils/speed-test";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json<SpeedTestResult>(
      { quality: "未知", loadSpeed: "连接失败", pingTime: 0 },
      { status: 400 },
    );
  }

  try {
    // Fetch the master or media playlist
    const masterManifest = await withTimeout<string>(
      (signal) => fetchText(url, signal),
      REQUEST_TIMEOUT_MS,
    );

    let quality: string | null = parseVariantResolution(masterManifest);
    let mediaPlaylistUrl = url;

    // If it looks like a master playlist, pick first variant
    if (/EXT-X-STREAM-INF/i.test(masterManifest)) {
      const variantUrl = pickFirstVariantPlaylistUrl(masterManifest, url);
      if (!variantUrl) throw new Error("Variant playlist not found");
      mediaPlaylistUrl = variantUrl;
      const variantManifest = await withTimeout<string>(
        (signal) => fetchText(mediaPlaylistUrl, signal),
        REQUEST_TIMEOUT_MS,
      );
      // Variant may include its own resolution; if not, keep previous
      quality = parseVariantResolution(variantManifest) ?? quality;
      // Pick first segment from variant media playlist
      const segUrl = pickFirstSegmentUrlFromMediaPlaylist(
        variantManifest,
        mediaPlaylistUrl,
      );
      if (!segUrl) throw new Error("Segment not found");
      const pingTime = await withTimeout<number>(
        (signal) => headPing(segUrl, signal),
        REQUEST_TIMEOUT_MS,
      );
      const speed = await withTimeout<{
        speedLabel: string;
        bytesRead: number;
        ms: number;
      }>(
        (signal) => measureSpeed(segUrl, BYTES_TO_FETCH, signal),
        REQUEST_TIMEOUT_MS,
      );
      return NextResponse.json<SpeedTestResult>({
        quality: quality ?? "未知",
        loadSpeed: speed.speedLabel,
        pingTime: Math.max(0, Math.round(pingTime)),
      });
    }

    // Otherwise treat as media playlist
    const segUrl = pickFirstSegmentUrlFromMediaPlaylist(masterManifest, url);
    if (!segUrl) throw new Error("Segment not found");
    const pingTime = await withTimeout<number>(
      (signal) => headPing(segUrl, signal),
      REQUEST_TIMEOUT_MS,
    );
    const speed = await withTimeout<{
      speedLabel: string;
      bytesRead: number;
      ms: number;
    }>(
      (signal) => measureSpeed(segUrl, BYTES_TO_FETCH, signal),
      REQUEST_TIMEOUT_MS,
    );
    return NextResponse.json<SpeedTestResult>({
      quality: quality ?? "未知",
      loadSpeed: speed.speedLabel,
      pingTime: Math.max(0, Math.round(pingTime)),
    });
  } catch (err: unknown) {
    const message = (err as Error)?.name === "AbortError" ? "超时" : "测试失败";
    return NextResponse.json<SpeedTestResult>(
      {
        quality: "未知",
        loadSpeed: message,
        pingTime: 0,
      },
      { status: 200 },
    );
  }
}
