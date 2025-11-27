import { z } from "zod";

export const vodObjectSchema = z.object({
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
});

export type VodObject = z.infer<typeof vodObjectSchema>;

// Helper to generate unique ID from source and vod_id
export function getVodUniqueId(vod: VodObject): string {
  return `${vod.source}_${vod.source_vod_id}`;
}