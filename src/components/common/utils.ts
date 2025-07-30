import Hls from 'hls.js';

import { SpeedTestResult } from './types';

// Get badge color and style based on speed
export const getSpeedBadgeProps = (loadSpeed: string) => {
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
        className: 'text-xs px-2 py-1 bg-green-500 text-white border-green-600',
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

// Get badge color and style based on ping time
export const getPingBadgeProps = (pingTime: number) => {
  if (pingTime <= 0) {
    return {
      className: 'text-xs px-2 py-1 bg-gray-500 text-white border-gray-600',
      variant: 'secondary' as const,
    };
  }

  if (pingTime <= 100) {
    // Green for excellent latency (≤100ms)
    return {
      className: 'text-xs px-2 py-1 bg-green-500 text-white border-green-600',
      variant: 'default' as const,
    };
  }
  if (pingTime <= 200) {
    // Yellow for good latency (≤200ms)
    return {
      className: 'text-xs px-2 py-1 bg-yellow-500 text-white border-yellow-600',
      variant: 'default' as const,
    };
  }
  if (pingTime <= 500) {
    // Orange for fair latency (≤500ms)
    return {
      className: 'text-xs px-2 py-1 bg-orange-500 text-white border-orange-600',
      variant: 'default' as const,
    };
  }
  // Red for poor latency (>500ms)
  return {
    className: 'text-xs px-2 py-1 bg-red-500 text-white border-red-600',
    variant: 'destructive' as const,
  };
};

export const getFirstM3u8Url = (
  m3u8_urls: string | null | undefined,
): string | null => {
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

export const testStreamSpeed = async (
  m3u8Url: string,
): Promise<SpeedTestResult> => {
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

  return new Promise((resolve) => {
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

export const getSourceBrand = (source: string) => {
  const _source = source.toLowerCase();

  if (/dytt/g.test(_source)) {
    return '电影天堂资源';
  }

  if (/mtyun/g.test(_source)) {
    return '茅台资源';
  }

  switch (_source) {
    case 'heimuer':
      return '黑木耳资源';
    case 'wolong':
      return '卧龙资源';
    default:
      return '未知';
  }
};
