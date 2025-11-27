import { z } from "zod";

export const dazahui_schema = z.object({
  id: z.number(),
  title: z.string().min(1),
  m3u8_urls: z.record(z.string().min(1), z.string().min(1)),
  language: z.string(), // Can be empty string
  cover_image: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  region: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  casting: z.string().optional(),
  category: z.string().nullable().optional(),
  source_vod_id: z.string(),
  source: z.string(),
  douban_id: z.string(), // Can be empty string
  imdb_id: z.string(), // Can be empty string
  tmdb_id: z.string(), // Can be empty string
});

export type Dazahui = z.infer<typeof dazahui_schema>;

// Helper to generate unique ID from source and vod_id
export function getVodUniqueId(dazahui: Dazahui): string {
  return `${dazahui.source}_${dazahui.source_vod_id}`;
}
