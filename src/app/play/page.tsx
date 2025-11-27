import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

import {
  CaijiClient,
  getSourceByKey,
  loadSourcesFromSettings,
  normalizeVod,
} from "@/lib/caiji";
import { normalizedVodToVodObject } from "@/lib/caiji/adapter";

import PageLayout from "@/components/common/page-layout";
import { McPlay } from "@/components/mc-play";

import type { VodObject } from "@/schemas/vod";

interface McPlayPageProps {
  searchParams: Promise<{
    vod_id?: string;
    vod_src?: string;
    index?: string;
  }>;
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
  let vodObject: VodObject | null = null;

  if (source) {
    try {
      const client = new CaijiClient(source);
      const response = await client.getDetail(vodId);

      if (response.code === 1 && response.list && response.list.length > 0) {
        const vod = response.list[0];
        const normalized = normalizeVod(vod, sourceKey);
        vodObject = normalizedVodToVodObject(normalized);
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
      <McPlay vod={vodObject} />
    </Suspense>
  );
}
