import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";

type Props = {
  vodId: string;
  vodSrc: string;
  episodes: { episode: string; url: string }[];
  currentEpisode: { episode: string; url: string } | null;
};

export const EpisodeIndex = ({ vodId, vodSrc, episodes, currentEpisode }: Props) => {
  return (
    <div className='bg-white rounded-lg shadow w-full'>
      <div className='p-4 border-b flex items-center gap-4'>
        <h3 className='text-lg font-semibold text-gray-900'>剧集列表</h3>
        <p className='text-sm text-gray-600'>共 {episodes.length} 集</p>
      </div>
      <div className='max-h-96 overflow-y-auto'>
        <div className='grid grid-cols-6 gap-2 p-2'>
          {episodes.map(({ episode }, index) => (
            <Link
              key={episode}
              href={`/play?vod_id=${vodId}&vod_src=${vodSrc}&index=${index + 1}`}
              className={cn(
                "cursor-pointer",
                "aspect-square flex items-center justify-center text-sm font-medium rounded-lg border-2 transition-all hover:scale-105",
                currentEpisode?.episode === episode
                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-md"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
              )}
            >
              {episode}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
