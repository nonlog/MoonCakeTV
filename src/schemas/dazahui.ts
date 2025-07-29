import { z } from 'zod';

export const dazahui_schema = z.object({
  id: z.number(),
  mc_id: z.string(),
  title: z.string().min(1),
  m3u8_urls: z.string().min(1),
  language: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  region: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  casting: z.string().optional(),
  category: z.string().nullable().optional(),
  source_vod_id: z.string(),
  source: z.string(),
  douban_id: z.string().nullable().optional(),
  imdb_id: z.string().nullable().optional(),
  tmdb_id: z.string().nullable().optional(),
});

export type Dazahui = z.infer<typeof dazahui_schema>;
