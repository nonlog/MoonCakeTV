import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getVodUniqueId, VodObject } from "@/schemas/vod";

import { MediaCard } from "../common/media-card";
import { setSourceNameCache } from "../common/utils";

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

interface SourceInfo {
  key: string;
  name: string;
}

export const RandomMedia = ({
  handleCardClick,
}: {
  handleCardClick: (vod: VodObject) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [random, setRandom] = useState<VodObject[] | null>(null);
  const [sources, setSources] = useState<SourceInfo[]>([]);

  // Fetch sources on mount
  useEffect(() => {
    fetch("/api/caiji/sources")
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 200 && json.data?.sources) {
          const sourceList = json.data.sources as SourceInfo[];
          setSources(sourceList);
          setSourceNameCache(sourceList);
        }
      })
      .catch((err) => {
        console.log("Failed to fetch sources:", err);
      });
  }, []);

  const triggerRandom = () => {
    setLoading(true);
    fetch("/api/caiji/recent?limit=20")
      .then((res) => res.json())
      .then((json) => {
        // Convert NormalizedVod array to VodObject array
        const items = (json.data?.items || []).map(normalizedVodToVodObject);
        setRandom(items);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    triggerRandom();
  }, []);

  return (
    <div className='px-2 sm:px-10 py-4 sm:py-8 overflow-visible'>
      <div className='max-w-[95%]'>
        <div className='mb-8'>
          <div className='flex items-center gap-4'>
            <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
              随机推荐
            </h2>
            <Button
              size='lg'
              className='bg-purple-900 text-white text-xl cursor-pointer'
              onClick={triggerRandom}
            >
              换一批
            </Button>
          </div>

          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-gray-600 dark:text-gray-400'>数据来源:</span>
            {sources.length > 0 ? (
              sources.map((source) => (
                <Badge
                  key={source.key}
                  variant='outline'
                  className='text-xs px-2 py-0.5 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                >
                  {source.name}
                </Badge>
              ))
            ) : (
              <span className='text-gray-500 dark:text-gray-500 text-sm'>加载中...</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-500'></div>
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
            {random?.map((item, index) => (
              <MediaCard
                key={getVodUniqueId(item) || index}
                vodObject={item}
                onClick={() => handleCardClick(item)}
                showSpeedTest
                userId='me'
              />
            )) || (
              <div className='col-span-full text-center py-12'>
                <p className='text-gray-500 dark:text-gray-400'>暂无数据</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
