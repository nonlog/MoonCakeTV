"use client";

import DOMPurify from "dompurify";
import { Bookmark } from "lucide-react";
import { BookmarkCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

import { getSourceBrand } from "@/components/common/utils";
import { McPlayer } from "@/components/mc-play/mc-player";
import { Badge } from "@/components/ui/badge";

import { useUserStore } from "@/stores/user";

import { Dazahui } from "@/schemas/dazahui";

import { PageLayout } from "../common/page-layout";

export const McPlay = ({ mc_item }: { mc_item: Dazahui | null }) => {
  const [currentEpisode, setCurrentEpisode] = useState<string>("");
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

  const currentVideoUrl = useMemo(() => {
    if (!currentEpisode) {
      return episodes[0]?.url || "";
    }
    return episodes.find((ep) => ep.episode === currentEpisode)?.url || "";
  }, [currentEpisode, episodes]);

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

  // Set initial episode
  useMemo(() => {
    if (episodes.length > 0 && !currentEpisode) {
      setCurrentEpisode(episodes[0].episode);
    }
  }, [episodes, currentEpisode]);

  // Sanitize summary on client side only
  useEffect(() => {
    if (mc_item?.summary && typeof window !== "undefined") {
      setSanitizedSummary(DOMPurify.sanitize(mc_item.summary));
    }
  }, [mc_item?.summary]);

  // Update watch history when playing content
  useEffect(() => {
    if (mc_item && mc_item.mc_id) {
      setWatchHistory(mc_item);
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
              {`${mc_item.title} - ${currentEpisode}`}
            </h1>
            <button
              onClick={handleBookmarkToggle}
              className={cn(
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
          {/* Video Player - Left Side */}
          <div className='lg:col-span-2'>
            <McPlayer videoUrl={currentVideoUrl} poster={mc_item.cover_image} />

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

            {/* Additional Info */}
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

          {/* Episodes List - Right Side */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow'>
              <div className='p-4 border-b flex items-center gap-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  剧集列表
                </h3>
                <p className='text-sm text-gray-600'>共 {episodes.length} 集</p>
              </div>
              <div className='max-h-96 overflow-y-auto'>
                <div className='grid grid-cols-6 gap-2 p-2'>
                  {episodes.map(({ episode }) => (
                    <button
                      key={episode}
                      onClick={() => setCurrentEpisode(episode)}
                      className={cn(
                        "cursor-pointer",
                        "aspect-square flex items-center justify-center text-sm font-medium rounded-lg border-2 transition-all hover:scale-105",
                        currentEpisode === episode
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-md"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
                      )}
                    >
                      {episode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
};
