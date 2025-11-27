"use client";

import DOMPurify from "dompurify";
import { Bookmark } from "lucide-react";
import { BookmarkCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import React from "react";

import { cn } from "@/lib/utils";

import { getSourceBrand } from "@/components/common/utils";
import { EpisodeIndex } from "@/components/mc-play/episode-index";
import { McPlayer } from "@/components/mc-play/mc-player";
import { Badge } from "@/components/ui/badge";

import { useUserStore } from "@/stores/user";

import { getVodUniqueId, VodObject } from "@/schemas/vod";

import { PageLayout } from "../common/page-layout";

// Memoized video section to prevent re-renders when bookmark state changes
const VideoSection = React.memo(
  ({
    currentEpisode,
    coverImage,
    vodId,
    vodSrc,
    episodes,
  }: {
    currentEpisode: { episode: string; url: string } | null;
    coverImage?: string | null;
    vodId: string;
    vodSrc: string;
    episodes: { episode: string; url: string }[];
  }) => (
    <div className='flex gap-4 flex-col lg:flex-row'>
      <div
        className={cn("w-full lg:w-2/3", episodes.length <= 1 && "lg:w-full")}
      >
        <McPlayer videoUrl={currentEpisode?.url || ""} poster={coverImage} />
      </div>
      <div className={cn("w-full lg:w-1/3", episodes.length <= 1 && "hidden")}>
        <EpisodeIndex
          vodId={vodId}
          vodSrc={vodSrc}
          episodes={episodes}
          currentEpisode={currentEpisode}
        />
      </div>
    </div>
  ),
);

VideoSection.displayName = "VideoSection";

export const McPlay = ({ vod }: { vod: VodObject | null }) => {
  const searchParams = useSearchParams();

  const index = searchParams.get("index") || "1";

  const [currentEpisode, setCurrentEpisode] = useState<{
    episode: string;
    url: string;
  } | null>(null);
  const [sanitizedSummary, setSanitizedSummary] = useState<string>("");
  const { setWatchHistory, bookmarks, updateBookmarks, currentUserId } =
    useUserStore();

  const episodes = useMemo(() => {
    if (!vod) {
      return [];
    }
    return Object.entries(vod.m3u8_urls).map(([episode, url]) => ({
      episode,
      url: url as string,
    }));
  }, [vod]);

  useEffect(() => {
    const i = Number(index);
    if (i && episodes.length > 0 && i >= 1 && i <= episodes.length) {
      setCurrentEpisode(episodes[i - 1]);
    }
  }, [index, episodes]);

  // Check if current item is bookmarked
  const isBookmarked = useMemo(() => {
    if (!vod || !currentUserId) return false;
    const userBookmarks = bookmarks[currentUserId];
    const itemId = getVodUniqueId(vod);
    return (
      userBookmarks?.some((bookmark) => getVodUniqueId(bookmark) === itemId) ||
      false
    );
  }, [bookmarks, currentUserId, vod]);

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    if (!vod || !currentUserId) return;
    const action = isBookmarked ? "delete" : "add";
    updateBookmarks(currentUserId, vod, action);
  };

  // Update watch history when playing content
  useEffect(() => {
    if (vod && vod.source && vod.source_vod_id) {
      setWatchHistory(vod);
    }

    // Sanitize summary on client side only
    if (vod?.summary && typeof window !== "undefined") {
      setSanitizedSummary(DOMPurify.sanitize(vod.summary));
    }
  }, [vod]); // eslint-disable-line

  if (!vod) {
    return (
      <PageLayout activePath='/play'>
        <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='bg-white rounded-lg shadow p-6'>
            <p className='text-gray-600'>No content available</p>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/play'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        {/* Title and Info */}
        <div className='mb-6 flex flex-col gap-4'>
          <div className='flex items-center gap-4'>
            <h1 className='text-2xl font-bold text-gray-900'>
              {`${vod.title} - ${currentEpisode?.episode}`}
            </h1>
            <button
              onClick={handleBookmarkToggle}
              className={cn(
                "cursor-pointer",
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105",
                isBookmarked
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                  : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200",
              )}
            >
              {isBookmarked ? (
                <BookmarkCheck className='w-5 h-5' />
              ) : (
                <Bookmark className='w-5 h-5' />
              )}
              <span className='text-sm font-medium'>
                {isBookmarked ? "已收藏" : "添加收藏"}
              </span>
            </button>
          </div>
          <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
            {vod.year && <span>{vod.year}</span>}
            {vod.region && <span>{vod.region}</span>}
            {vod.category && <span>{vod.category}</span>}
            {vod.source && (
              <Badge
                variant='secondary'
                className='text-xs px-2 py-1 bg-blue/70 border-green-600 backdrop-blur-sm'
              >
                {getSourceBrand(vod.source)}
              </Badge>
            )}
          </div>

          {vod.casting && (
            <div className='flex flex-col flex-wrap gap-2'>
              <h4 className='font-semibold text-gray-900'>演职员表</h4>
              <div className='text-sm text-gray-600'>{vod.casting}</div>
            </div>
          )}
        </div>

        {/* Main Content Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-3'>
            <VideoSection
              currentEpisode={currentEpisode}
              coverImage={vod.cover_image}
              vodId={vod.source_vod_id}
              vodSrc={vod.source}
              episodes={episodes}
            />

            {/* Video Info */}
            <div className='mt-4 flex flex-col md:flex-row gap-4'>
              {vod.summary && (
                <div className='bg-white rounded-lg shadow p-4 flex-1'>
                  <h3 className='text-lg font-semibold mb-2'>剧情简介</h3>
                  <div
                    className='text-gray-700 text-sm leading-relaxed'
                    dangerouslySetInnerHTML={{
                      __html: sanitizedSummary,
                    }}
                  />
                </div>
              )}

              {vod.cover_image && (
                <div className='bg-white dark:bg-zinc-900 rounded-lg shadow p-4 md:w-auto'>
                  <img
                    src={vod.cover_image}
                    alt={vod.title}
                    className='max-w-sm w-full rounded-lg object-cover'
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
};
