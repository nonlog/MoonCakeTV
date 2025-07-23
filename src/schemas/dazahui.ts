import { z } from 'zod';

export const dazahui_schema = z.object({
  id: z.number(),
  title: z.string().min(1),
  m3u8_urls: z.record(
    z
      .string()
      .regex(
        /^(s\d+e\d+|ep\d+)_(720p|1080p|4K|HD|mobile)$/i,
        'Format: s1e1_1080p or ep1_1080p',
      ),
    z.string().regex(/^https?:\/\/.+/, 'Must be a valid URL'),
  ),
  language: z.string(),
  cover_image: z.string(),
  year: z.number(),
  region: z.string(),
  summary: z.string(),
  cast: z.array(z.string()).optional(),
  category: z.string(),
  source_vod_id: z.string(),
  source: z.string(),
  douban_id: z.string().optional(),
  imdb_id: z.string().optional(),
  tmdb_id: z.string().optional(),
});
