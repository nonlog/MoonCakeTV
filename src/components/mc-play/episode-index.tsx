import React from "react";

import { cn } from "@/lib/utils";

type Props = {
  episodes: { episode: string; url: string }[];
  currentEpisode: string;
  setCurrentEpisode: (episode: string) => void;
};

export const EpisodeIndex = ({
  episodes,
  currentEpisode,
  setCurrentEpisode,
}: Props) => {
  return (
    <div className='bg-white rounded-lg shadow w-full'>
      <div className='p-4 border-b flex items-center gap-4'>
        <h3 className='text-lg font-semibold text-gray-900'>剧集列表</h3>
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
  );
};
