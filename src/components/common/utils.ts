import { SpeedTestResult } from "./types";

// Get badge color and style based on speed
export const getSpeedBadgeProps = (speedTestResult: SpeedTestResult) => {
  const { loadSpeed } = speedTestResult;

  // Handle error states with specific colors
  const errorStates = [
    "连接失败",
    "超时",
    "视频错误",
    "网络错误",
    "媒体错误",
    "解码错误",
    "未知错误",
    "播放失败",
    "测试失败",
  ];
  if (errorStates.some((error) => loadSpeed.includes(error))) {
    return {
      className: "text-xs px-2 py-1 bg-red-600 text-white border-red-700",
      variant: "destructive" as const,
    };
  }

  if (loadSpeed.includes("MB/s")) {
    const speed = parseFloat(loadSpeed);
    if (speed >= 3) {
      // Green for fast (≥3MB/s)
      return {
        className: "text-xs px-2 py-1 bg-green-500 text-white border-green-600",
        variant: "default" as const,
      };
    }
    if (speed >= 1) {
      // Orange for medium (≥1MB/s)
      return {
        className:
          "text-xs px-2 py-1 bg-orange-500 text-white border-orange-600",
        variant: "default" as const,
      };
    }
    // Red for slow (<1MB/s)
    return {
      className: "text-xs px-2 py-1 bg-red-500 text-white border-red-600",
      variant: "destructive" as const,
    };
  }
  if (loadSpeed.includes("KB/s")) {
    const speed = parseFloat(loadSpeed);
    if (speed >= 1000) {
      // Orange for 1000+ KB/s (≥1MB/s equivalent)
      return {
        className:
          "text-xs px-2 py-1 bg-orange-500 text-white border-orange-600",
        variant: "default" as const,
      };
    }
    // Red for slow (<1000 KB/s)
    return {
      className: "text-xs px-2 py-1 bg-red-500 text-white border-red-600",
      variant: "destructive" as const,
    };
  }
  // Gray for unknown/failed
  return {
    className: "text-xs px-2 py-1 bg-gray-500 text-white border-gray-600",
    variant: "secondary" as const,
  };
};

// Get badge color and style based on ping time
export const getPingBadgeProps = (pingTime: number) => {
  if (pingTime <= 0) {
    return {
      className: "text-xs px-2 py-1 bg-gray-500 text-white border-gray-600",
      variant: "secondary" as const,
    };
  }

  if (pingTime <= 100) {
    // Green for excellent latency (≤100ms)
    return {
      className: "text-xs px-2 py-1 bg-green-500 text-white border-green-600",
      variant: "default" as const,
    };
  }
  if (pingTime <= 200) {
    // Yellow for good latency (≤200ms)
    return {
      className: "text-xs px-2 py-1 bg-yellow-500 text-white border-yellow-600",
      variant: "default" as const,
    };
  }
  if (pingTime <= 500) {
    // Orange for fair latency (≤500ms)
    return {
      className: "text-xs px-2 py-1 bg-orange-500 text-white border-orange-600",
      variant: "default" as const,
    };
  }
  // Red for poor latency (>500ms)
  return {
    className: "text-xs px-2 py-1 bg-red-500 text-white border-red-600",
    variant: "destructive" as const,
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
    console.error("Failed to parse m3u8_urls:", error);
  }

  return null;
};

const MAX_CONCURRENT_TESTS = 4;

function createConcurrencyLimiter(maxConcurrent: number) {
  let activeCount = 0;
  const queue: Array<() => void> = [];

  const dequeueIfPossible = () => {
    if (activeCount >= maxConcurrent) return;
    const start = queue.shift();
    start?.();
  };

  const runWithLimit = async <T>(task: () => Promise<T>): Promise<T> => {
    if (activeCount >= maxConcurrent) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    activeCount += 1;
    try {
      return await task();
    } finally {
      activeCount = Math.max(0, activeCount - 1);
      dequeueIfPossible();
    }
  };

  return runWithLimit;
}

const limitSpeedTests = createConcurrencyLimiter(MAX_CONCURRENT_TESTS);

type CacheEntry = { result: SpeedTestResult; timestamp: number; ttlMs: number };
const speedTestCache = new Map<string, CacheEntry>();
const inflightSpeedTests = new Map<string, Promise<SpeedTestResult>>();

export const testStreamSpeed = async (
  m3u8Url: string,
  options?: { signal?: AbortSignal; cacheKey?: string; ttlMs?: number },
): Promise<SpeedTestResult> => {
  const signal = options?.signal;
  const cacheKey = options?.cacheKey ?? m3u8Url;
  const ttlMs = options?.ttlMs ?? 60_000; // default 60s

  // Cache check
  const cached = cacheKey ? speedTestCache.get(cacheKey) : undefined;
  if (cached && Date.now() - cached.timestamp < cached.ttlMs) {
    return cached.result;
  }

  if (cacheKey && inflightSpeedTests.has(cacheKey)) {
    const inFlight = inflightSpeedTests.get(cacheKey);
    if (inFlight) return inFlight;
  }

  const run = limitSpeedTests(async () => {
    try {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const res = await fetch(
        `/api/speed-test?url=${encodeURIComponent(m3u8Url)}`,
        { cache: "no-store", signal },
      );
      if (!res.ok) {
        return { quality: "未知", loadSpeed: "测试失败", pingTime: 0 };
      }
      const data = (await res.json()) as SpeedTestResult;
      if (cacheKey) {
        speedTestCache.set(cacheKey, {
          result: data,
          timestamp: Date.now(),
          ttlMs,
        });
      }
      return data;
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        return { quality: "未知", loadSpeed: "", pingTime: 0 };
      }
      return { quality: "未知", loadSpeed: "连接失败", pingTime: 0 };
    }
  });

  if (cacheKey) inflightSpeedTests.set(cacheKey, run);
  try {
    return await run;
  } finally {
    if (cacheKey) inflightSpeedTests.delete(cacheKey);
  }
};

export const getSourceBrand = (source: string) => {
  const _source = source.toLowerCase();

  if (/dytt/g.test(_source)) {
    return "电影天堂资源";
  }

  if (/mtyun/g.test(_source)) {
    return "茅台资源";
  }

  switch (_source) {
    case "heimuer":
      return "黑木耳资源";
    case "wolong":
      return "卧龙资源";
    default:
      return "未知";
  }
};
