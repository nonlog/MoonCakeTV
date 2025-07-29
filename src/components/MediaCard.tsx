import Hls from 'hls.js';
import { Calendar, Globe, Play, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Dazahui } from '@/schemas/dazahui';

interface MediaCardProps {
  dazahui: Dazahui;
  onClick?: () => void;
  showSpeedTest?: boolean;
}

interface SpeedTestResult {
  quality: string;
  loadSpeed: string;
  pingTime: number;
}

export function MediaCard({
  dazahui,
  onClick,
  showSpeedTest = false,
}: MediaCardProps) {
  const {
    id,
    mc_id,
    cover_image,
    title,
    summary,
    category,
    language,
    year,
    region,
    casting,
    m3u8_urls,
  } = dazahui;

  const [speedTestResult, setSpeedTestResult] =
    useState<SpeedTestResult | null>(null);
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);

  // Speed test function with fallback mechanism
  const testStreamSpeed = async (m3u8Url: string): Promise<SpeedTestResult> => {
    // First try a simple connectivity test
    try {
      const connectivityTest = await fetch(m3u8Url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      console.log('Connectivity test passed for:', m3u8Url);
    } catch (error) {
      console.warn('Connectivity test failed:', error);
      // If basic connectivity fails, return a fallback result
      return {
        quality: '未知',
        loadSpeed: '连接失败',
        pingTime: 0,
      };
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous'; // Try to handle CORS

      // Measure network latency
      const pingStart = performance.now();
      let pingTime = 0;

      fetch(m3u8Url, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          pingTime = performance.now() - pingStart;
        })
        .catch(() => {
          pingTime = performance.now() - pingStart;
        });

      const hls = new Hls({
        debug: false,
        enableWorker: false, // Disable worker to avoid some CORS issues
        maxLoadingDelay: 2000, // Reduce loading delay
        maxBufferLength: 10, // Reduce buffer to speed up testing
        fragLoadingTimeOut: 3000, // 3 second timeout for fragments
        manifestLoadingTimeOut: 3000, // 3 second timeout for manifest
      });

      const timeout = setTimeout(() => {
        console.warn('Speed test timeout for:', m3u8Url);
        hls.destroy();
        video.remove();
        // Return a timeout result instead of rejecting
        resolve({
          quality: '未知',
          loadSpeed: '超时',
          pingTime: Math.round(pingTime) || 0,
        });
      }, 6000); // Increased timeout to 6 seconds

      video.onerror = (error) => {
        console.warn('Video element error:', error);
        clearTimeout(timeout);
        hls.destroy();
        video.remove();
        // Return an error result instead of rejecting
        resolve({
          quality: '未知',
          loadSpeed: '视频错误',
          pingTime: Math.round(pingTime) || 0,
        });
      };

      let actualLoadSpeed = '未知';
      let hasSpeedCalculated = false;
      let hasMetadataLoaded = false;
      let fragmentStartTime = 0;

      const checkAndResolve = () => {
        if (
          hasMetadataLoaded &&
          (hasSpeedCalculated || actualLoadSpeed !== '未知')
        ) {
          clearTimeout(timeout);
          const width = video.videoWidth;
          hls.destroy();
          video.remove();

          const quality =
            width >= 3840
              ? '4K'
              : width >= 2560
                ? '2K'
                : width >= 1920
                  ? '1080p'
                  : width >= 1280
                    ? '720p'
                    : width >= 854
                      ? '480p'
                      : width > 0
                        ? 'SD'
                        : '未知';

          resolve({
            quality,
            loadSpeed: actualLoadSpeed,
            pingTime: Math.round(pingTime),
          });
        }
      };

      hls.on(Hls.Events.FRAG_LOADING, () => {
        fragmentStartTime = performance.now();
      });

      hls.on(Hls.Events.FRAG_LOADED, (_event: any, data: any) => {
        if (
          fragmentStartTime > 0 &&
          data &&
          data.payload &&
          !hasSpeedCalculated
        ) {
          const loadTime = performance.now() - fragmentStartTime;
          const size = data.payload.byteLength || 0;

          if (loadTime > 0 && size > 0) {
            const speedKBps = size / 1024 / (loadTime / 1000);

            if (speedKBps >= 1024) {
              actualLoadSpeed = `${(speedKBps / 1024).toFixed(1)} MB/s`;
            } else {
              actualLoadSpeed = `${speedKBps.toFixed(1)} KB/s`;
            }
            hasSpeedCalculated = true;
            checkAndResolve();
          }
        }
      });

      hls.loadSource(m3u8Url);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
        console.warn('HLS Error Details:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: m3u8Url,
          reason: data.reason || 'Unknown',
        });

        if (data.fatal) {
          clearTimeout(timeout);
          hls.destroy();
          video.remove();

          // Provide more specific error messages based on error type
          let errorMessage = '测试失败';
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              errorMessage = '网络错误';
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              errorMessage = '媒体错误';
              break;
            case Hls.ErrorTypes.MUX_ERROR:
              errorMessage = '解码错误';
              break;
            case Hls.ErrorTypes.OTHER_ERROR:
              errorMessage = '未知错误';
              break;
            default:
              errorMessage = '播放失败';
          }

          // Return an error result instead of rejecting to avoid breaking the UI
          resolve({
            quality: '未知',
            loadSpeed: errorMessage,
            pingTime: Math.round(pingTime) || 0,
          });
        }
      });

      video.onloadedmetadata = () => {
        hasMetadataLoaded = true;
        checkAndResolve();
      };
    });
  };

  // Parse m3u8_urls and get the first available URL
  const getFirstM3u8Url = (): string | null => {
    if (!m3u8_urls) return null;

    try {
      const urlsObject = JSON.parse(m3u8_urls);
      const episodes = Object.keys(urlsObject);

      if (episodes.length > 0) {
        return urlsObject[episodes[0]];
      }
    } catch (error) {
      console.error('Failed to parse m3u8_urls:', error);
    }

    return null;
  };

  // Run speed test when component mounts and showSpeedTest is true
  useEffect(() => {
    console.log('🚀 MediaCard useEffect triggered:', {
      showSpeedTest,
      hasM3u8Urls: !!m3u8_urls,
      hasSpeedTestResult: !!speedTestResult,
      isTestingSpeed,
      title,
    });

    const firstUrl = getFirstM3u8Url();
    console.log('🔗 First URL extracted:', firstUrl);

    if (showSpeedTest && firstUrl && !speedTestResult && !isTestingSpeed) {
      console.log('✅ Starting speed test for:', title);

      // Check if HLS.js is available
      if (!Hls.isSupported()) {
        console.error('❌ HLS.js is not supported in this browser');
        setSpeedTestResult({
          quality: '未知',
          loadSpeed: '不支持',
          pingTime: 0,
        });
        return;
      }

      setIsTestingSpeed(true);
      testStreamSpeed(firstUrl)
        .then((result) => {
          console.log('✅ Speed test completed:', result);
          setSpeedTestResult(result);
        })
        .catch((error) => {
          console.error('❌ Speed test failed:', error);
          setSpeedTestResult({
            quality: '未知',
            loadSpeed: '测试失败',
            pingTime: 0,
          });
        })
        .finally(() => {
          setIsTestingSpeed(false);
        });
    } else {
      console.log('⏭️ Skipping speed test:', {
        showSpeedTest,
        hasFirstUrl: !!firstUrl,
        hasSpeedTestResult: !!speedTestResult,
        isTestingSpeed,
      });
    }
  }, [showSpeedTest, m3u8_urls, speedTestResult, isTestingSpeed]);

  // Get badge color and style based on speed
  const getSpeedBadgeProps = (loadSpeed: string) => {
    // Handle error states with specific colors
    const errorStates = [
      '连接失败',
      '超时',
      '视频错误',
      '网络错误',
      '媒体错误',
      '解码错误',
      '未知错误',
      '播放失败',
      '测试失败',
    ];
    if (errorStates.some((error) => loadSpeed.includes(error))) {
      return {
        className: 'text-xs px-2 py-1 bg-red-600 text-white border-red-700',
        variant: 'destructive' as const,
      };
    }

    if (loadSpeed.includes('MB/s')) {
      const speed = parseFloat(loadSpeed);
      if (speed >= 3) {
        // Green for fast (≥3MB/s)
        return {
          className:
            'text-xs px-2 py-1 bg-green-500 text-white border-green-600',
          variant: 'default' as const,
        };
      }
      if (speed >= 1) {
        // Orange for medium (≥1MB/s)
        return {
          className:
            'text-xs px-2 py-1 bg-orange-500 text-white border-orange-600',
          variant: 'default' as const,
        };
      }
      // Red for slow (<1MB/s)
      return {
        className: 'text-xs px-2 py-1 bg-red-500 text-white border-red-600',
        variant: 'destructive' as const,
      };
    }
    if (loadSpeed.includes('KB/s')) {
      const speed = parseFloat(loadSpeed);
      if (speed >= 1000) {
        // Orange for 1000+ KB/s (≥1MB/s equivalent)
        return {
          className:
            'text-xs px-2 py-1 bg-orange-500 text-white border-orange-600',
          variant: 'default' as const,
        };
      }
      // Red for slow (<1000 KB/s)
      return {
        className: 'text-xs px-2 py-1 bg-red-500 text-white border-red-600',
        variant: 'destructive' as const,
      };
    }
    // Gray for unknown/failed
    return {
      className: 'text-xs px-2 py-1 bg-gray-500 text-white border-gray-600',
      variant: 'secondary' as const,
    };
  };
  return (
    <Card
      key={id}
      className='group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden'
      onClick={onClick}
    >
      <div className='relative'>
        {cover_image ? (
          <div className='aspect-[3/4] overflow-hidden'>
            <img
              key={mc_id}
              src={cover_image}
              alt={title}
              loading='lazy'
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className='hidden aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 justify-center items-center'>
              <Play className='w-12 h-12 text-slate-400' />
            </div>
          </div>
        ) : (
          <div className='aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center'>
            <Play className='w-12 h-12 text-slate-400' />
          </div>
        )}

        {/* Speed Test Badge - Top Right Corner */}
        {showSpeedTest && (
          <div className='absolute top-2 right-2 z-10'>
            {isTestingSpeed ? (
              <Badge
                variant='outline'
                className='text-xs px-2 py-1 bg-blue-500 text-white border-blue-600'
              >
                <Wifi className='w-3 h-3 mr-1 animate-pulse' />
                测速中...
              </Badge>
            ) : speedTestResult ? (
              <Badge
                variant={getSpeedBadgeProps(speedTestResult.loadSpeed).variant}
                className={
                  getSpeedBadgeProps(speedTestResult.loadSpeed).className
                }
              >
                <Wifi className='w-3 h-3 mr-1' />
                {speedTestResult.quality} | {speedTestResult.loadSpeed}
              </Badge>
            ) : (
              // Debug badge to show why speed test isn't running
              <Badge
                variant='secondary'
                className='text-xs px-2 py-1 bg-gray-500 text-white border-gray-600'
              >
                <Wifi className='w-3 h-3 mr-1' />
                {!m3u8_urls
                  ? '无URL'
                  : !getFirstM3u8Url()
                    ? '解析失败'
                    : '等待中...'}
              </Badge>
            )}
          </div>
        )}

        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100'>
          <Play className='w-8 h-8 text-white' />
        </div>
      </div>

      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium line-clamp-2 leading-tight'>
          {title}
        </CardTitle>
        {summary && (
          <CardDescription className='text-xs line-clamp-2'>
            {summary}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className='pt-0 space-y-2'>
        <div className='flex flex-wrap gap-1'>
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
