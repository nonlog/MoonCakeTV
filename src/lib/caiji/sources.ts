import type { CaijiSource } from "./types";

/**
 * Default CaiJi sources (fallback if no user config)
 */
export const DEFAULT_SOURCES: CaijiSource[] = [
  {
    key: "maotai",
    name: "茅台资源",
    api: "https://mtzy.tv/api.php/provide/vod",
    enabled: true,
    priority: 1,
  },
  {
    key: "jisu",
    name: "极速资源",
    api: "https://jisuzy.com/api.php/provide/vod",
    enabled: true,
    priority: 2,
  },
];

// In-memory cache for sources (server-side)
let cachedSources: CaijiSource[] | null = null;

/**
 * Set sources (called from API route after loading from file storage)
 */
export function setSourcesCache(sources: CaijiSource[]): void {
  cachedSources = sources;
}

/**
 * Get cached sources or default
 */
export function getCachedSources(): CaijiSource[] {
  return cachedSources || DEFAULT_SOURCES;
}

/**
 * Clear sources cache (call when settings change)
 */
export function clearSourcesCache(): void {
  cachedSources = null;
}

/**
 * Get all enabled sources sorted by priority
 */
export function getEnabledSources(): CaijiSource[] {
  const sources = getCachedSources();
  return sources.filter((s) => s.enabled).sort((a, b) => a.priority - b.priority);
}

/**
 * Get a source by its key
 */
export function getSourceByKey(key: string): CaijiSource | undefined {
  const sources = getCachedSources();
  return sources.find((s) => s.key === key);
}

/**
 * Check if a URL appears to be a full API URL (has a path component)
 */
function isFullApiUrl(url: string): boolean {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    // Has a meaningful path (not just "/" or empty)
    return urlObj.pathname.length > 1;
  } catch {
    return false;
  }
}

/**
 * Parse sources from user input (one per line)
 *
 * Supported formats:
 * 1. "名称 domain" - Domain only, auto-appends /api.php/provide/vod
 *    Example: "茅台资源 mtzy.tv"
 *
 * 2. "名称 full_url" - Full URL with custom path, preserved as-is
 *    Example: "步步高资源 https://api.yparse.com/api/json"
 *    Example: "TV-1080资源 https://api.1080zyku.com/inc/api_mac10.php"
 *
 * 3. "full_url" - Just URL, name extracted from domain
 *    Example: "https://api.yparse.com/api/json"
 */
export function parseSourcesFromText(text: string): CaijiSource[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const sources: CaijiSource[] = [];

  lines.forEach((line, index) => {
    // Skip comments
    if (line.startsWith("#") || line.startsWith("//")) return;

    // Split by space: "茅台资源 mtzy.tv" -> ["茅台资源", "mtzy.tv"]
    const parts = line.split(/\s+/);

    let name: string;
    let urlPart: string;

    if (parts.length >= 2) {
      // Format: "名称 url_or_domain"
      name = parts[0];
      urlPart = parts[parts.length - 1]; // Take last part as URL/domain
    } else {
      // Just URL/domain, extract name from it
      urlPart = parts[0];
      // Extract name from domain
      try {
        const urlObj = new URL(urlPart.startsWith("http") ? urlPart : `https://${urlPart}`);
        name = urlObj.hostname.replace(/^(www\.|api\.|cj\.)/, "").split(".")[0];
      } catch {
        name = urlPart.replace(/^(www\.|api\.|cj\.)/, "").split(".")[0];
      }
    }

    // Build API URL
    let api = urlPart;
    if (!api.startsWith("http")) {
      api = `https://${api}`;
    }

    // Only auto-append /api.php/provide/vod if:
    // 1. URL doesn't already have a meaningful path
    // 2. URL is just a domain
    if (!isFullApiUrl(urlPart)) {
      api = api.replace(/\/$/, "") + "/api.php/provide/vod";
    }

    // Generate key from name
    const key = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "") || `source${index}`;

    sources.push({
      key: `${key}_${index}`,
      name,
      api,
      enabled: true,
      priority: index + 1,
    });
  });

  return sources.length > 0 ? sources : DEFAULT_SOURCES;
}

/**
 * Convert sources to text format for display
 * Preserves full URL with path if it's non-standard, otherwise shows just domain
 */
export function sourcesToText(sources: CaijiSource[]): string {
  return sources
    .map((s) => {
      // Check if API uses standard path
      const isStandardPath = s.api.endsWith("/api.php/provide/vod");

      if (isStandardPath) {
        // Standard path: show just domain for cleaner display
        const cleanUrl = s.api
          .replace(/^https?:\/\//, "")
          .replace(/\/api\.php\/provide\/vod\/?$/, "");
        return `${s.name} ${cleanUrl}`;
      } else {
        // Custom path: preserve full URL
        return `${s.name} ${s.api}`;
      }
    })
    .join("\n");
}

/**
 * Health check for a source - tests if the API is responding
 */
export async function checkSourceHealth(source: CaijiSource): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${source.api}?ac=videolist&pg=1`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return data.code === 1 && Array.isArray(data.list);
  } catch {
    return false;
  }
}
