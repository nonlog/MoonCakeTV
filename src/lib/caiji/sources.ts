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
 * Parse sources from user input (one per line)
 * Format: "名称 domain" (space-separated)
 * Example: "茅台资源 mtzy.tv"
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
    let domain: string;

    if (parts.length >= 2) {
      // Format: "名称 domain"
      name = parts[0];
      domain = parts[parts.length - 1]; // Take last part as domain
    } else {
      // Just domain, extract name from it
      domain = parts[0];
      name = domain.replace(/^(www\.|api\.|cj\.)/, "").split(".")[0];
    }

    // Build API URL
    let api = domain;
    if (!api.startsWith("http")) {
      api = `https://${api}`;
    }
    if (!api.includes("/api.php/provide/vod")) {
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
 */
export function sourcesToText(sources: CaijiSource[]): string {
  return sources
    .map((s) => {
      // Remove https:// and /api.php/provide/vod for cleaner display
      const cleanUrl = s.api
        .replace(/^https?:\/\//, "")
        .replace(/\/api\.php\/provide\/vod\/?$/, "");
      return `${s.name} ${cleanUrl}`;
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
