import { NextRequest } from "next/server";

export const runtime = "edge";

// Optional allowlist: comma-separated hostnames, e.g. "example.com,cdn.example.com"
const ALLOWED_HOSTS = (process.env.HLS_PROXY_ALLOW_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isHostAllowed(url: string): boolean {
  if (ALLOWED_HOSTS.length === 0) return true; // allow all if not configured
  try {
    const u = new URL(url);
    return ALLOWED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

function pickCacheTtlMs(targetUrl: string): number {
  const pathname = (() => {
    try {
      return new URL(targetUrl).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();
  if (pathname.endsWith(".m3u8")) return 30_000; // manifests: 30s
  if (pathname.endsWith(".ts") || pathname.endsWith(".m4s")) return 300_000; // segments: 5m
  return 60_000; // default 60s
}

function buildCacheHeaders(ttlMs: number): HeadersInit {
  const seconds = Math.max(0, Math.floor(ttlMs / 1000));
  return {
    "Cache-Control": `public, max-age=${seconds}`,
  };
}

async function proxy(req: NextRequest): Promise<Response> {
  const target = req.nextUrl.searchParams.get("url");
  if (!target || !isHttpUrl(target) || !isHostAllowed(target)) {
    return new Response("Invalid or disallowed url", { status: 400 });
  }

  const method = req.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const headers: HeadersInit = {};
  // Forward a minimal set of safe headers
  const incoming = req.headers;
  const range = incoming.get("range");
  if (range) headers["Range"] = range;
  const accept = incoming.get("accept");
  if (accept) headers["Accept"] = accept;
  const ifNoneMatch = incoming.get("if-none-match");
  if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;
  const ifModifiedSince = incoming.get("if-modified-since");
  if (ifModifiedSince) headers["If-Modified-Since"] = ifModifiedSince;

  // Optional referer passthrough if client provides query ?ref=... or header x-proxy-referer
  const refParam = req.nextUrl.searchParams.get("ref");
  const xRef = incoming.get("x-proxy-referer");
  const effectiveRef = refParam || xRef || null;
  if (effectiveRef) headers["Referer"] = effectiveRef;

  // Some upstreams require Referer/Origin; default to target origin if not provided
  try {
    const targetUrl = new URL(target);
    if (!("Referer" in headers)) headers["Referer"] = targetUrl.origin;
    if (!("Origin" in headers)) headers["Origin"] = targetUrl.origin;
  } catch {
    // ignore
  }

  // Provide a reasonable User-Agent if none was forwarded
  const ua = incoming.get("user-agent");
  if (ua) headers["User-Agent"] = ua;
  else
    headers["User-Agent"] =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  const controller = new AbortController();
  const ttlMs = pickCacheTtlMs(target);
  try {
    const upstream = await fetch(target, {
      method,
      headers,
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "";
    const isPlaylist =
      contentType.toLowerCase().includes("application/vnd.apple.mpegurl") ||
      contentType.toLowerCase().includes("application/x-mpegurl") ||
      target.toLowerCase().includes(".m3u8");

    // Build response headers
    const resHeaders = new Headers();
    // Pass through selected headers
    const passthroughHeaders = [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "etag",
      "last-modified",
    ];
    passthroughHeaders.forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) resHeaders.set(h, v);
    });

    // Set caching
    const cacheHeaders = buildCacheHeaders(ttlMs);
    Object.entries(cacheHeaders).forEach(([k, v]) => resHeaders.set(k, v));

    const status = upstream.status;

    if (isPlaylist && method === "GET") {
      // Rewrite playlist so all URIs (lines and attribute URIs) go back through this proxy
      const text = await upstream.text();
      const base = new URL(target);
      const refAttach = effectiveRef
        ? `&ref=${encodeURIComponent(effectiveRef)}`
        : "";

      const rewriteAttrUris = (line: string): string => {
        // Replace URI="..." or URI='...'
        return line.replace(
          /URI=("|')([^"']+)(\1)/g,
          (_match, quote: string, uri: string) => {
            try {
              const abs = new URL(uri, base).toString();
              const proxied = `/api/proxy/hls?url=${encodeURIComponent(abs)}${refAttach}`;
              return `URI=${quote}${proxied}${quote}`;
            } catch {
              return _match as unknown as string;
            }
          },
        );
      };

      const lines = text.split(/\r?\n/);
      const rewritten = lines
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith("#")) {
            // Rewrite attribute URIs for KEY, MAP, MEDIA, I-FRAME-STREAM-INF
            if (
              trimmed.startsWith("#EXT-X-KEY") ||
              trimmed.startsWith("#EXT-X-MAP") ||
              trimmed.startsWith("#EXT-X-MEDIA") ||
              trimmed.startsWith("#EXT-X-I-FRAME-STREAM-INF")
            ) {
              return rewriteAttrUris(line);
            }
            return line;
          }
          // Non-tag line: treat as URI
          try {
            const abs = new URL(trimmed, base).toString();
            return `/api/proxy/hls?url=${encodeURIComponent(abs)}${refAttach}`;
          } catch {
            return line;
          }
        })
        .join("\n");
      resHeaders.set(
        "content-type",
        upstream.headers.get("content-type") || "application/vnd.apple.mpegurl",
      );
      return new Response(rewritten, { status, headers: resHeaders });
    }

    // Stream body for segments and other assets; avoid body on HEAD
    if (method === "HEAD") {
      return new Response(null, { status, headers: resHeaders });
    }
    return new Response(upstream.body, { status, headers: resHeaders });
  } catch (err: unknown) {
    const message =
      (err as Error)?.name === "AbortError" ? "Timeout" : "Bad Gateway";
    return new Response(message, { status: 502 });
  } finally {
    // nothing to cleanup in edge runtime
  }
}

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function HEAD(req: NextRequest) {
  return proxy(req);
}
