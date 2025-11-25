import { Loader2 } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

import PageLayout from "@/components/common/page-layout";
import { McPlay } from "@/components/mc-play";

import type { Dazahui } from "@/schemas/dazahui";

interface McPlayPageProps {
  searchParams: Promise<{ mc_id: string | string[] | undefined }>;
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
    mc_id: vod.id,
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
  const mc_id = _searchParams.mc_id as string;

  if (!mc_id?.trim()) {
    redirect("/");
  }

  // Get auth cookie to pass to internal API
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("mc-auth-token");

  // Build absolute URL for server-side fetch
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3333";
  const res = await fetch(`${baseUrl}/api/caiji/detail?id=${mc_id}`, {
    headers: authCookie ? { Cookie: `mc-auth-token=${authCookie.value}` } : {},
    cache: "no-store",
  });

  const json = await res.json();

  // Convert NormalizedVod to Dazahui format
  const mc_item = json.data ? vodToDazahui(json.data) : null;

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
