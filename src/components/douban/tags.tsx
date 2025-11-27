import React, { useEffect, useState } from "react";

import { DoubanMovieItem, DoubanTVItem } from "./types";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const DoubanTags = () => {
  const [movies, setMovies] = useState<DoubanMovieItem[]>([]);
  const [tvs, setTvs] = useState<DoubanTVItem[]>([]);

  useEffect(() => {
    fetch("https://s1.m3u8.io/v1/douban")
      .then((res) => res.json())
      .then((json) => {
        setMovies(json.data?.movies || []);
        setTvs(json.data?.tv || []);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className='px-2 sm:px-10 py-4 sm:py-8 overflow-visible flex flex-col gap-8'>
      <div className='flex flex-col gap-6'>
        <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
          豆瓣热门电影
        </h2>
        <div className='flex flex-wrap gap-2'>
          {movies.map((movie) => (
            <React.Fragment key={movie.id}>
              <Badge
                variant='outline'
                className='cursor-pointer hover:bg-purple-900 hover:text-white px-2 py-1 border-2 border-blue-300 dark:border-gray-700'
                onClick={() => {
                  window.open(
                    `/search?keyword=${encodeURIComponent(movie.title)}`,
                    "_blank",
                  );
                }}
              >
                {`${movie.title} (${movie.rate})`}
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(movie.cover)}`}
                    alt={movie.title}
                    className='w-10 h-10 rounded object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all'
                    loading='lazy'
                    onClick={() => {
                      window.open(
                        `/search?keyword=${encodeURIComponent(movie.title)}`,
                        "_blank",
                      );
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side='top' className='p-1'>
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(movie.cover)}`}
                    alt={movie.title}
                    className='w-64 h-96 rounded object-cover shadow-lg'
                    loading='lazy'
                    onClick={() => {
                      window.open(
                        `/search?keyword=${encodeURIComponent(movie.title)}`,
                        "_blank",
                      );
                    }}
                  />
                  <p className='text-center text-sm mt-2 font-medium'>
                    {movie.title} ({movie.rate})
                  </p>
                </TooltipContent>
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className='flex flex-col gap-6'>
        <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
          豆瓣热门电视剧
        </h2>
        <div className='flex flex-wrap gap-2'>
          {tvs.map((tv) => (
            <React.Fragment key={tv.id}>
              <Badge
                variant='outline'
                className='cursor-pointer hover:bg-purple-900 hover:text-white px-2 py-1 border-2 border-blue-300 dark:border-gray-700'
                onClick={() => {
                  window.open(
                    `/search?keyword=${encodeURIComponent(tv.title)}`,
                    "_blank",
                  );
                }}
              >
                {`${tv.title} (${tv.rating.value})`}
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(tv.pic.normal)}`}
                    alt={tv.title}
                    className='w-10 h-10 rounded object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all'
                    loading='lazy'
                    onClick={() => {
                      window.open(
                        `/search?keyword=${encodeURIComponent(tv.title)}`,
                        "_blank",
                      );
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side='top' className='p-1'>
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(tv.pic.large)}`}
                    alt={tv.title}
                    className='w-64 h-96 rounded object-cover shadow-lg'
                    loading='lazy'
                    onClick={() => {
                      window.open(
                        `/search?keyword=${encodeURIComponent(tv.title)}`,
                        "_blank",
                      );
                    }}
                  />
                  <p className='text-center text-sm mt-2 font-medium'>
                    {tv.title} ({tv.rating.value})
                  </p>
                </TooltipContent>
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
