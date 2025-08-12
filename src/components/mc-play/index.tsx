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

import { Dazahui } from "@/schemas/dazahui";

import { PageLayout } from "../common/page-layout";

// Memoized video section to prevent re-renders when bookmark state changes
const VideoSection = React.memo(
  ({
    currentEpisode,
    coverImage,
    mcId,
    episodes,
  }: {
    currentEpisode: { episode: string; url: string } | null;
    coverImage?: string | null;
    mcId: string;
    episodes: { episode: string; url: string }[];
  }) => (
    <div className='flex gap-4 flex-col lg:flex-row'>
      <div className='w-full lg:w-2/3'>
        <McPlayer videoUrl={currentEpisode?.url || ""} poster={coverImage} />
      </div>
      <div className='w-full lg:w-1/3'>
        <EpisodeIndex
          mc_id={mcId}
          episodes={episodes}
          currentEpisode={currentEpisode}
        />
      </div>
    </div>
  ),
);

VideoSection.displayName = "VideoSection";

export const McPlay = ({ mc_item }: { mc_item: Dazahui | null }) => {
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
    if (!mc_item) {
      return [];
    }
    try {
      const m3u8_kv = JSON.parse(mc_item.m3u8_urls);
      return Object.entries(m3u8_kv).map(([episode, url]) => ({
        episode,
        url: url as string,
      }));
    } catch (err) {
      console.log(err);
      return [];
    }
  }, [mc_item]);

  useEffect(() => {
    const i = Number(index);
    if (i && episodes.length > 0 && i >= 1 && i <= episodes.length) {
      setCurrentEpisode(episodes[i - 1]);
    }
  }, [index, episodes]);

  // Check if current item is bookmarked
  const isBookmarked = useMemo(() => {
    if (!mc_item || !currentUserId) return false;
    const userBookmarks = bookmarks[currentUserId];
    return (
      userBookmarks?.some((bookmark) => bookmark.mc_id === mc_item.mc_id) ||
      false
    );
  }, [bookmarks, currentUserId, mc_item]);

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    if (!mc_item || !currentUserId) return;
    const action = isBookmarked ? "delete" : "add";
    updateBookmarks(currentUserId, mc_item, action);
  };

  // Update watch history when playing content
  useEffect(() => {
    if (mc_item && mc_item.mc_id) {
      setWatchHistory(mc_item);
    }

    // Sanitize summary on client side only
    if (mc_item?.summary && typeof window !== "undefined") {
      setSanitizedSummary(DOMPurify.sanitize(mc_item.summary));
    }
  }, [mc_item]); // eslint-disable-line

  if (!mc_item) {
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
              {`${mc_item.title} - ${currentEpisode?.episode}`}
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
            {mc_item.year && <span>{mc_item.year}</span>}
            {mc_item.region && <span>{mc_item.region}</span>}
            {mc_item.category && <span>{mc_item.category}</span>}
            {mc_item.source && (
              <Badge
                variant='secondary'
                className='text-xs px-2 py-1 bg-blue/70 border-green-600 backdrop-blur-sm'
              >
                {getSourceBrand(mc_item.source)}
              </Badge>
            )}
          </div>

          {mc_item.casting && (
            <div className='flex flex-col flex-wrap gap-2'>
              <h4 className='font-semibold text-gray-900'>演职员表</h4>
              <div className='text-sm text-gray-600'>{mc_item.casting}</div>
            </div>
          )}
        </div>

        {/* Main Content Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-3'>
            <VideoSection
              currentEpisode={currentEpisode}
              coverImage={mc_item.cover_image}
              mcId={mc_item.mc_id}
              episodes={episodes}
            />

            {/* Video Info */}
            {mc_item.summary && (
              <div className='mt-4 bg-white rounded-lg shadow p-4'>
                <h3 className='text-lg font-semibold mb-2'>剧情简介</h3>
                <div
                  className='text-gray-700 text-sm leading-relaxed'
                  dangerouslySetInnerHTML={{
                    __html: sanitizedSummary,
                  }}
                />
              </div>
            )}

            {mc_item.cover_image && (
              <div className='mt-4 bg-white rounded-lg shadow p-4'>
                {mc_item.cover_image && (
                  <div className='mb-4'>
                    <img
                      src={mc_item.cover_image}
                      alt={mc_item.title}
                      className='w-full rounded-lg'
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageLayout>
  );
};
