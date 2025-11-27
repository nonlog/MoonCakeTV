"use client";

import { Bookmark, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MediaCard } from "@/components/common/media-card";
import PageLayout from "@/components/common/page-layout";

import { useUserStore } from "@/stores/user";

import { getVodUniqueId, VodObject } from "@/schemas/vod";

export default function BookmarksPage() {
  const router = useRouter();
  const { bookmarks, currentUserId } = useUserStore();

  const [allBookmarks, setAllBookmarks] = useState<VodObject[]>([]);

  useEffect(() => {
    // Combine all bookmarks from all users into a single array
    // In a real app, you'd filter by current user
    const userBookmarks = bookmarks[currentUserId] || [];
    setAllBookmarks(userBookmarks);
  }, [bookmarks, currentUserId]);

  const handleCardClick = (vod: VodObject) => {
    router.push(`/play?vod_id=${vod.source_vod_id}&vod_src=${vod.source}`);
  };

  return (
    <PageLayout activePath='/bookmarks'>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full'>
        {/* Page Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center'>
              <Bookmark className='w-5 h-5 text-yellow-600' />
            </div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              收藏夹
            </h1>
          </div>
          <p className='text-gray-600 dark:text-gray-400'>
            {allBookmarks.length > 0
              ? `共收藏了 ${allBookmarks.length} 部作品`
              : "还没有收藏任何作品"}
          </p>
        </div>

        {/* Bookmarks Grid */}
        {allBookmarks.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6'>
              <Bookmark className='w-10 h-10 text-yellow-500' />
            </div>
            <h3 className='text-xl font-medium text-gray-900 dark:text-gray-100 mb-2'>
              收藏夹是空的
            </h3>
            <p className='text-gray-500 dark:text-gray-400 max-w-sm mb-6'>
              浏览内容时点击收藏按钮，就可以在这里找到它们了
            </p>
            <button
              onClick={() => {
                router.push("/search");
              }}
              className='inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors'
            >
              <Play className='w-4 h-4' />
              开始探索
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {allBookmarks.map((bookmark) => (
              <MediaCard
                key={getVodUniqueId(bookmark)}
                vodObject={bookmark}
                userId={currentUserId}
                showSpeedTest={false}
                onClick={() => handleCardClick(bookmark)}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
