import type { Dazahui } from "@/schemas/dazahui";

import { flattenEpisodes } from "./parser";
import type { NormalizedVod } from "./types";

/**
 * Convert NormalizedVod to Dazahui format
 * This allows using the new CaiJi API with existing frontend components
 */
export function vodToDazahui(vod: NormalizedVod): Dazahui {
  // Flatten episodes to simple { episodeName: url } format
  const m3u8_urls = flattenEpisodes(vod.episodes);

  return {
    id: 0, // Not used in new system
    mc_id: vod.id,
    title: vod.title,
    m3u8_urls,
    language: vod.language || "",
    cover_image: vod.cover || null,
    year: vod.year ? parseInt(vod.year) || null : null,
    region: vod.area || null,
    summary: vod.summary || null,
    casting: vod.actors.join(",") || undefined,
    category: vod.categories[0] || null,
    source_vod_id: String(vod.sourceVodId),
    source: vod.sourceKey,
    douban_id: vod.doubanId ? String(vod.doubanId) : "",
    imdb_id: "",
    tmdb_id: "",
  };
}

/**
 * Convert array of NormalizedVod to Dazahui array
 */
export function vodsToDazahui(vods: NormalizedVod[]): Dazahui[] {
  return vods.map(vodToDazahui);
}
