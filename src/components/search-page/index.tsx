"use client";

import { Loader2, Play } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MediaCard } from "@/components/common/media-card";
import PageLayout from "@/components/common/page-layout";
import McSearchBar from "@/components/mc-search/search-bar";

import { getVodUniqueId, VodObject } from "@/schemas/vod";

// Helper to convert CaiJi NormalizedVod to VodObject format
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

function normalizedVodToVodObject(vod: NormalizedVod): VodObject {
  // Flatten episodes: get first source's episodes
  const firstSource = Object.keys(vod.episodes)[0];
  const m3u8_urls = firstSource ? vod.episodes[firstSource] : {};

  return {
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
  };
}

export function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<VodObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchKeyword?: string) => {
    const searchTerm = searchKeyword || keyword;
    if (!searchTerm.trim() || searchTerm.trim().length <= 1) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `/api/caiji/search?keyword=${encodeURIComponent(searchTerm)}`,
      );
      const json = await res.json();

      // Flatten results from all sources and convert to VodObject format
      const allItems: VodObject[] = [];
      if (json.data?.results) {
        for (const sourceResult of json.data.results) {
          for (const item of sourceResult.items || []) {
            allItems.push(normalizedVodToVodObject(item));
          }
        }
      }
      setResults(allItems);
    } catch (error) {
      console.error(error);
      toast.error("搜索失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandom = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/caiji/recent?limit=20`);
      const json = await res.json();

      // Convert to VodObject format
      const items = (json.data?.items || []).map(normalizedVodToVodObject);
      setResults(items);
    } catch (error) {
      console.error(error);
      toast.error("搜索失败");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize keyword from URL params and trigger search if present
  useEffect(() => {
    const urlKeyword = searchParams.get("keyword") || "";
    if (urlKeyword) {
      setKeyword(urlKeyword);
      handleSearch(urlKeyword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUrlParams = (newKeyword: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newKeyword.trim()) {
      params.set("keyword", newKeyword.trim());
    } else {
      params.delete("keyword");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const handleKeywordChange = (v: string) => {
    setKeyword(v);
    updateUrlParams(v);
  };

  if (isLoading) {
    return (
      <PageLayout activePath='/search'>
        <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full flex flex-col gap-4'>
          <McSearchBar
            handleSearch={handleSearch}
            keyword={keyword}
            handleKeywordChange={handleKeywordChange}
            handleRandom={handleRandom}
          />
          <div className='grow flex items-center justify-center w-full h-full'>
            <Loader2 className='w-10 h-10 animate-spin' />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/search'>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full flex flex-col gap-4'>
        <McSearchBar
          handleSearch={handleSearch}
          keyword={keyword}
          handleKeywordChange={handleKeywordChange}
          handleRandom={handleRandom}
        />
        {!hasSearched ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4'>
              <Play className='w-8 h-8 text-slate-400' />
            </div>
            <h3 className='text-lg font-medium text-slate-900 mb-2'>
              开始搜索内容
            </h3>
            <p className='text-slate-500 max-w-sm'>
              在上方输入关键词并按回车键开始搜索
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4'>
              <Play className='w-8 h-8 text-slate-400' />
            </div>
            <h3 className='text-lg font-medium text-slate-900 mb-2'>
              没有找到相关内容
            </h3>
            <p className='text-slate-500 max-w-sm'>
              尝试使用不同的关键词或检查拼写是否正确
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
            {results.map((result) => (
              <MediaCard
                key={getVodUniqueId(result)}
                vodObject={result}
                showSpeedTest={true}
                onClick={() => {
                  // Handle click - navigate to play page or show details
                  router.push(`/play?vod_id=${result.source_vod_id}&vod_src=${result.source}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
