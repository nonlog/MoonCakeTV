"use client";

import { Clock, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { MediaCard } from "@/components/common/media-card";
import PageLayout from "@/components/common/page-layout";

import { useUserStore } from "@/stores/user";

import { getVodUniqueId, VodObject } from "@/schemas/vod";

export default function WatchHistoryPage() {
  const router = useRouter();
  const { watchHistory, setWatchHistory, currentUserId } = useUserStore();

  const handleCardClick = (vod: VodObject) => {
    router.push(`/play?vod_id=${vod.source_vod_id}&vod_src=${vod.source}`);
  };

  const handleClearHistory = () => {
    if (confirm("确定要清空所有观看历史吗？此操作无法撤销。")) {
      setWatchHistory(); // Clear all watch history
    }
  };

  return (
    <PageLayout activePath='/watch-history'>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible w-full min-h-full'>
        {/* Page Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                <Clock className='w-5 h-5 text-blue-600' />
              </div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                观看历史
              </h1>
            </div>
            {watchHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className='cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                title='清空观看历史'
              >
                <Trash2 className='w-8 h-8' />
                清空
              </button>
            )}
          </div>
          <p className='text-gray-600 dark:text-gray-400'>
            {watchHistory.length > 0
              ? `最近观看了 ${watchHistory.length} 部作品 (最多保留100部)`
              : "还没有观看记录"}
          </p>
        </div>

        {/* Watch History Grid */}
        {watchHistory.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6'>
              <Clock className='w-10 h-10 text-blue-500' />
            </div>
            <h3 className='text-xl font-medium text-gray-900 dark:text-gray-100 mb-2'>
              暂无观看历史
            </h3>
            <p className='text-gray-500 dark:text-gray-400 max-w-sm mb-6'>
              开始观看内容后，这里会显示你的观看记录
            </p>
            <button
              onClick={() => {
                router.push("/search");
              }}
              className='inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
            >
              <Play className='w-4 h-4' />
              开始观看
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {watchHistory.map((historyItem, index) => (
              <MediaCard
                key={`${getVodUniqueId(historyItem)}-${index}`}
                vodObject={historyItem}
                userId={currentUserId}
                showSpeedTest={false}
                onClick={() => handleCardClick(historyItem)}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
