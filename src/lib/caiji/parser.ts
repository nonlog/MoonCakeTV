import type { CaijiVod, NormalizedVod,ParsedEpisodes } from "./types";

/**
 * Parse vod_play_url with multiple sources
 *
 * Format:
 *   vod_play_from: "jsyun$$jsm3u8"
 *   vod_play_url:  "ep1$url1#ep2$url2$$ep1$url3#ep2$url4"
 *
 * The $$ delimiter separates different sources
 * The # delimiter separates episodes within a source
 * The $ delimiter separates episode name from URL
 */
export function parsePlayUrls(
  vodPlayFrom: string,
  vodPlayUrl: string
): ParsedEpisodes {
  if (!vodPlayFrom || !vodPlayUrl) {
    return {};
  }

  const sources = vodPlayFrom.split("$$").filter(Boolean);
  const urlGroups = vodPlayUrl.split("$$");

  const result: ParsedEpisodes = {};

  sources.forEach((source, index) => {
    const sourceName = source.trim();
    if (!sourceName) return;

    result[sourceName] = {};

    const episodesStr = urlGroups[index];
    if (!episodesStr) return;

    const episodes = episodesStr.split("#");

    episodes.forEach((ep) => {
      // Find the first $ to split (episode names might contain special chars)
      const delimiterIndex = ep.indexOf("$");
      if (delimiterIndex <= 0) return;

      const name = ep.substring(0, delimiterIndex).trim();
      const url = ep.substring(delimiterIndex + 1).trim();

      // Validate URL starts with http
      if (name && url && (url.startsWith("http://") || url.startsWith("https://"))) {
        result[sourceName][name] = url;
      }
    });
  });

  return result;
}

/**
 * Transform raw CaiJi VOD item to normalized format
 */
export function normalizeVod(vod: CaijiVod, sourceKey: string): NormalizedVod {
  const episodes = parsePlayUrls(vod.vod_play_from, vod.vod_play_url);

  return {
    id: `${sourceKey}_${vod.vod_id}`,
    sourceKey,
    sourceVodId: vod.vod_id,
    title: vod.vod_name || "",
    subtitle: vod.vod_sub || "",
    cover: vod.vod_pic || "",
    remarks: vod.vod_remarks || "",
    year: vod.vod_year || "",
    area: vod.vod_area || "",
    language: vod.vod_lang || "",
    categories: parseCommaSeparated(vod.vod_class),
    actors: parseCommaSeparated(vod.vod_actor),
    directors: parseCommaSeparated(vod.vod_director),
    summary: buildSummary(vod.vod_blurb, vod.vod_content),
    episodes,
    doubanId: vod.vod_douban_id || null,
    doubanScore: parseFloat(vod.vod_douban_score) || null,
    updatedAt: vod.vod_time || "",
    hits: vod.vod_hits || 0,
    typeName: vod.type_name || "",
  };
}

/**
 * Parse comma-separated string to array
 */
function parseCommaSeparated(str: string | null | undefined): string[] {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build summary from blurb and content
 */
function buildSummary(
  blurb: string | null | undefined,
  content: string | null | undefined
): string {
  const parts = [blurb, content].filter(Boolean);
  return parts.join("\n\n").trim();
}

/**
 * Get preferred play URL for an episode
 * Prefers sources with 'm3u8' in the name
 */
export function getPreferredPlayUrl(
  episodes: ParsedEpisodes,
  episodeName: string
): string | null {
  const sourceKeys = Object.keys(episodes);

  // Prioritize m3u8 sources
  const m3u8Sources = sourceKeys.filter((k) =>
    k.toLowerCase().includes("m3u8")
  );
  const otherSources = sourceKeys.filter(
    (k) => !k.toLowerCase().includes("m3u8")
  );

  for (const source of [...m3u8Sources, ...otherSources]) {
    const url = episodes[source]?.[episodeName];
    if (url) return url;
  }

  return null;
}

/**
 * Get all episode names from parsed episodes (deduplicated)
 */
export function getAllEpisodeNames(episodes: ParsedEpisodes): string[] {
  const names = new Set<string>();

  Object.values(episodes).forEach((sourceEpisodes) => {
    Object.keys(sourceEpisodes).forEach((name) => names.add(name));
  });

  // Sort episodes naturally (第1集, 第2集, ... 第10集)
  return Array.from(names).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/\d+/)?.[0] || "0");
    return numA - numB;
  });
}

/**
 * Flatten episodes to simple { episodeName: url } format
 * Uses preferred source selection
 */
export function flattenEpisodes(
  episodes: ParsedEpisodes
): Record<string, string> {
  const result: Record<string, string> = {};
  const allNames = getAllEpisodeNames(episodes);

  allNames.forEach((name) => {
    const url = getPreferredPlayUrl(episodes, name);
    if (url) {
      result[name] = url;
    }
  });

  return result;
}
