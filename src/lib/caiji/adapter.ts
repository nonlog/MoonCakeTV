import type { VodObject } from "@/schemas/vod";

import { flattenEpisodes } from "./parser";
import type { NormalizedVod } from "./types";

/**
 * Convert NormalizedVod to VodObject format
 * This allows using the CaiJi API with frontend components
 */
export function normalizedVodToVodObject(vod: NormalizedVod): VodObject {
  // Flatten episodes to simple { episodeName: url } format
  const m3u8_urls = flattenEpisodes(vod.episodes);

  return {
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
  };
}

/**
 * Convert array of NormalizedVod to VodObject array
 */
export function normalizedVodsToVodObjects(vods: NormalizedVod[]): VodObject[] {
  return vods.map(normalizedVodToVodObject);
}
