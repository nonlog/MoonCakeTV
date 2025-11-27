import { Calendar, Globe, Play, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FaRegBookmark } from "react-icons/fa6";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useUserStore } from "@/stores/user";

import { getVodUniqueId, VodObject } from "@/schemas/vod";

import { SpeedTestResult } from "./types";
import {
  getFirstM3u8Url,
  getPingBadgeProps,
  getSourceBrand,
  getSpeedBadgeProps,
  testStreamSpeed,
} from "./utils";

interface MediaCardProps {
  vodObject: VodObject;
  onClick?: () => void;
  showSpeedTest?: boolean;
  userId?: string; // Required for bookmark functionality
}

export function MediaCard({
  vodObject,
  onClick,
  showSpeedTest = false,
  userId = "me",
}: MediaCardProps) {
  const {
    cover_image,
    title,
    // summary,
    category,
    language,
    year,
    region,
    casting,
    m3u8_urls,
    source,
  } = vodObject;

  const vodUniqueId = getVodUniqueId(vodObject);

  const [speedTestResult, setSpeedTestResult] =
    useState<SpeedTestResult | null>(null);
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const isMountedRef = useRef(true);
  const hasStartedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Bookmark functionality
  const { bookmarks, updateBookmarks } = useUserStore();

  // Check if current item is bookmarked
  const isBookmarked =
    userId && bookmarks[userId]
      ? bookmarks[userId]?.some(
          (bookmark) => getVodUniqueId(bookmark) === vodUniqueId,
        )
      : false;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!userId) return;

    const action = isBookmarked ? "delete" : "add";
    updateBookmarks(userId, vodObject, action);
    if (action === "add") {
      toast.success("添加收藏夹成功");
    }
    if (action === "delete") {
      toast.error("从收藏夹中移除成功");
    }
  };

  // Run speed test when component mounts and showSpeedTest is true

  useEffect(() => {
    const firstUrl = getFirstM3u8Url(m3u8_urls);
    if (!showSpeedTest || !firstUrl || speedTestResult) {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (abortRef.current) {
          abortRef.current.abort();
          abortRef.current = null;
        }
        hasStartedRef.current = false;
      };
    }

    if (hasStartedRef.current) {
      return () => {
        // no-op cleanup; an in-flight test is already managed
      };
    }

    timeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current || hasStartedRef.current) return;
      hasStartedRef.current = true;
      const abortController = new AbortController();
      abortRef.current = abortController;
      setIsTestingSpeed(true);
      testStreamSpeed(firstUrl, { signal: abortController.signal })
        .then((result) => {
          if (isMountedRef.current && !abortController.signal.aborted) {
            setSpeedTestResult(result);
          }
        })
        .catch(() => {
          if (isMountedRef.current && !abortController.signal.aborted) {
            setSpeedTestResult({
              quality: "未知",
              loadSpeed: "测试失败",
              pingTime: 0,
            });
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setIsTestingSpeed(false);
          }
          abortRef.current = null;
        });
    }, 400);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      // allow restart only when dependencies change meaningfully
      hasStartedRef.current = false;
    };
  }, [showSpeedTest, m3u8_urls, speedTestResult]);

  return (
    <Card
      key={vodUniqueId}
      className='group gap-3 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden py-3 w-full'
      onClick={onClick}
    >
      <div className='relative'>
        {cover_image ? (
          <div className='aspect-[4/3] md:aspect-[3/4] overflow-hidden'>
            <img
              key={vodUniqueId}
              src={cover_image}
              alt={title}
              loading='lazy'
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className='hidden aspect-[4/3] md:aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 justify-center items-center'>
              <Play className='w-12 h-12 text-slate-400' />
            </div>
          </div>
        ) : (
          <div className='aspect-[4/3] md:aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center'>
            <Play className='w-12 h-12 text-slate-400' />
          </div>
        )}

        {/* Bookmark Icon - Top Left Corner */}

        <div className='absolute top-2 left-2 z-10'>
          <button
            onClick={handleBookmarkClick}
            className={`cursor-pointer p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
              isBookmarked
                ? "bg-red-500/90 text-white shadow-lg"
                : "bg-black/50 text-white hover:bg-black/70"
            }`}
            title={isBookmarked ? "取消收藏" : "添加收藏"}
          >
            <FaRegBookmark
              className={`w-8 h-8 ${isBookmarked ? "fill-current" : ""}`}
            />
          </button>
        </div>

        {/* Speed Test Badges - Top Right Corner */}
        {showSpeedTest && (
          <div className='absolute top-2 right-2 z-10 flex flex-col gap-1 items-end'>
            {isTestingSpeed ? (
              <Badge
                variant='outline'
                className='text-xs px-2 py-1 bg-blue-500 text-white border-blue-600'
              >
                <Wifi className='w-3 h-3 mr-1 animate-pulse' />
                测速中...
              </Badge>
            ) : speedTestResult ? (
              <>
                {/* Speed and Quality Badge */}
                <Badge
                  variant={getSpeedBadgeProps(speedTestResult).variant}
                  className={getSpeedBadgeProps(speedTestResult).className}
                >
                  <Wifi className='w-3 h-3 mr-1' />
                  {speedTestResult.quality} | {speedTestResult.loadSpeed}
                </Badge>

                {/* Ping Badge - Only show if ping time is valid */}
                {speedTestResult.pingTime > 0 && (
                  <Badge
                    variant={
                      getPingBadgeProps(speedTestResult.pingTime).variant
                    }
                    className={
                      getPingBadgeProps(speedTestResult.pingTime).className
                    }
                  >
                    延迟 {speedTestResult.pingTime}ms
                  </Badge>
                )}
              </>
            ) : (
              // Debug badge to show why speed test isn't running
              <Badge
                variant='secondary'
                className='text-xs px-2 py-1 bg-gray-500 text-white border-gray-600'
              >
                <Wifi className='w-3 h-3 mr-1' />
                {!m3u8_urls
                  ? "无URL"
                  : !getFirstM3u8Url(m3u8_urls)
                    ? "解析失败"
                    : "等待中..."}
              </Badge>
            )}
          </div>
        )}

        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100'>
          <Play className='w-8 h-8 text-white' />
        </div>
      </div>

      <CardHeader className='gap-0'>
        <CardTitle className='text-sm font-medium line-clamp-2 leading-tight flex items-center justify-between w-full h-full'>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-2'>
        <div className='flex flex-wrap gap-1'>
          {source && (
            <Badge
              variant='secondary'
              className='text-xs px-2 py-1 bg-blue/70 border-green-600 backdrop-blur-sm'
            >
              {getSourceBrand(source)}
            </Badge>
          )}
          {category && (
            <Badge variant='secondary' className='text-xs px-2 py-0.5'>
              {category}
            </Badge>
          )}
          {language && (
            <Badge variant='outline' className='text-xs px-2 py-0.5'>
              <Globe className='w-3 h-3 mr-1' />
              {language}
            </Badge>
          )}
        </div>

        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          {year && (
            <div className='flex items-center gap-1'>
              <Calendar className='w-3 h-3' />
              <span>{year}</span>
            </div>
          )}
          {region && <span className='truncate'>{region}</span>}
        </div>

        {casting && casting.length > 0 && (
          <div className='text-xs text-muted-foreground'>
            <span className='font-medium'>演员: </span>
            <span className='line-clamp-1'>{casting}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
