export type SpeedTestResult = {
  quality: string;
  loadSpeed: string;
  pingTime: number;
};

export const runtime = "edge";

export const BYTES_TO_FETCH = 1024 * 512; // 512KB sample for speed test
export const REQUEST_TIMEOUT_MS = 6000;

export async function withTimeout<T>(
  op: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await op(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export function resolveUrl(baseUrl: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return maybeRelative;
  }
}

export function parseVariantResolution(manifest: string): string | null {
  // Look for RESOLUTION=WxH
  const match = manifest.match(/RESOLUTION\s*=\s*(\d+)x(\d+)/i);
  if (!match) return null;
  const width = Number(match[1]);
  if (width >= 3840) return "4K";
  if (width >= 2560) return "2K";
  if (width >= 1920) return "1080p";
  if (width >= 1280) return "720p";
  if (width >= 854) return "480p";
  if (width > 0) return "SD";
  return null;
}

export function pickFirstSegmentUrlFromMediaPlaylist(
  manifest: string,
  manifestUrl: string,
): string | null {
  const lines = manifest.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    // First non-tag line in a media playlist should be a segment URI
    return resolveUrl(manifestUrl, line);
  }
  return null;
}

export function pickFirstVariantPlaylistUrl(
  masterManifest: string,
  masterUrl: string,
): string | null {
  const lines = masterManifest.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    return resolveUrl(masterUrl, line);
  }
  return null;
}

export async function fetchText(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(url, { method: "GET", signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

export async function headPing(
  url: string,
  signal?: AbortSignal,
): Promise<number> {
  const start = Date.now();
  try {
    // Some servers may not support HEAD well; fall back to GET small range
    const res = await fetch(url, {
      method: "HEAD",
      signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    await fetch(url, {
      method: "GET",
      headers: { Range: `bytes=0-0` },
      signal,
      cache: "no-store",
    });
  }
  return Date.now() - start;
}

export async function measureSpeed(
  url: string,
  bytes: number,
  signal?: AbortSignal,
): Promise<{ speedLabel: string; bytesRead: number; ms: number }> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: { Range: `bytes=0-${bytes - 1}` },
    signal,
    cache: "no-store",
  });
  if (!res.ok && res.status !== 206 && res.status !== 200) {
    throw new Error(`Segment fetch failed: ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  const durationMs = Date.now() - start;
  const bytesRead = arrayBuf.byteLength;
  const bytesPerSec = (bytesRead / (durationMs || 1)) * 1000;
  const kbPerSec = bytesPerSec / 1024;
  const mbPerSec = kbPerSec / 1024;
  const speedLabel =
    kbPerSec >= 1024
      ? `${mbPerSec.toFixed(1)} MB/s`
      : `${kbPerSec.toFixed(1)} KB/s`;
  return { speedLabel, bytesRead, ms: durationMs };
}
