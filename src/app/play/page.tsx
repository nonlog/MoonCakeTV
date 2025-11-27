import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

import PageLayout from "@/components/common/page-layout";
import { McPlay } from "@/components/mc-play";
import {
  CaijiClient,
  getSourceByKey,
  loadSourcesFromSettings,
  normalizeVod,
} from "@/lib/caiji";

import type { Dazahui } from "@/schemas/dazahui";

interface McPlayPageProps {
  searchParams: Promise<{
    vod_id?: string;
    vod_src?: string;
    index?: string;
  }>;
}

// Helper to convert CaiJi NormalizedVod to Dazahui format
interface NormalizedVod {
  id: string;
  sourceKey: string;
  sourceVodId: number;
  title: string;
  subtitle: string;
  cover: string;
  remarks: string;
  year: string;
  area: string;
  language: string;
  categories: string[];
  actors: string[];
  directors: string[];
  summary: string;
  episodes: Record<string, Record<string, string>>;
  doubanId: number | null;
  doubanScore: number | null;
  updatedAt: string;
  hits: number;
  typeName: string;
}

function vodToDazahui(vod: NormalizedVod): Dazahui {
  // Flatten episodes: prefer m3u8 sources
  const sourceKeys = Object.keys(vod.episodes);
  const m3u8Source = sourceKeys.find((k) => k.toLowerCase().includes("m3u8"));
  const selectedSource = m3u8Source || sourceKeys[0];
  const m3u8_urls = selectedSource ? vod.episodes[selectedSource] : {};

  return {
    id: 0,
    title: vod.title,
    m3u8_urls,
    language: vod.language || "",
    cover_image: vod.cover || null,
    year: vod.year ? parseInt(vod.year) || null : null,
    region: vod.area || null,
    summary: vod.summary || null,
    casting: vod.actors?.join(",") || undefined,
    category: vod.categories?.[0] || null,
    source_vod_id: String(vod.sourceVodId),
    source: vod.sourceKey,
    douban_id: vod.doubanId ? String(vod.doubanId) : "",
    imdb_id: "",
    tmdb_id: "",
  };
}

export default async function McPlayPage({ searchParams }: McPlayPageProps) {
  const _searchParams = await searchParams;
  const vodIdStr = _searchParams.vod_id;
  const sourceKey = _searchParams.vod_src;

  if (!vodIdStr?.trim() || !sourceKey?.trim()) {
    redirect("/");
  }

  const vodId = parseInt(vodIdStr);
  if (isNaN(vodId)) {
    redirect("/");
  }

  // Load sources from user settings
  await loadSourcesFromSettings();

  // Find the source and fetch detail directly
  const source = getSourceByKey(sourceKey);
  let mc_item: Dazahui | null = null;

  if (source) {
    try {
      const client = new CaijiClient(source);
      const response = await client.getDetail(vodId);

      if (response.code === 1 && response.list && response.list.length > 0) {
        const vod = response.list[0];
        const normalized = normalizeVod(vod, sourceKey);
        mc_item = vodToDazahui(normalized);
      }
    } catch (error) {
      console.error(`Failed to fetch detail for ${sourceKey}_${vodId}:`, error);
    }
  }

  return (
    <Suspense
      fallback={
        <PageLayout activePath='/play'>
          <div className='w-full h-full flex items-center justify-center'>
            <Loader2 className='w-8 h-8 animate-spin' />
          </div>
        </PageLayout>
      }
    >
      <McPlay mc_item={mc_item} />
    </Suspense>
  );
}
