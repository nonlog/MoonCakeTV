import Hls, { ErrorData } from "hls.js";
import Player from "video.js/dist/types/player";

export const getHlsUrlVariations = (baseUrl: string): string[] => {
  const variations = [];

  // Original URL
  variations.push(baseUrl);

  // If it doesn't end with .m3u8, try adding /index.m3u8
  if (!baseUrl.endsWith(".m3u8")) {
    variations.push(`${baseUrl}/index.m3u8`);
    variations.push(`${baseUrl}.m3u8`);
  }

  return variations;
};

export const tryLoadSingleHlsUrl = (
  player: Player,
  videoEl: HTMLVideoElement,
  srcUrl: string,
  createAndAttachHls: (
    player: Player,
    videoEl: HTMLVideoElement,
    srcUrl: string,
  ) => Hls,
  attachNativeErrorHandler: (
    player: Player,
    videoEl: HTMLVideoElement,
    srcUrl: string,
  ) => void,
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!Hls.isSupported()) {
      resolve(false);
      return;
    }

    const hls = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: 30,
      backBufferLength: 30,
      maxBufferSize: 60 * 1000 * 1000,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      manifestLoadingMaxRetry: 1,
      manifestLoadingRetryDelay: 500,
      levelLoadingMaxRetry: 1,
      levelLoadingRetryDelay: 500,
      fragLoadingMaxRetry: 1,
      fragLoadingRetryDelay: 500,
    } as any);

    let resolved = false;

    // Set a timeout for HLS loading attempt
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          hls.destroy();
        } catch (_e) {
          // ignore
        }
        resolve(false);
      }
    }, 2000); // 2 second timeout per URL

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);

        // Successfully loaded as HLS, now set up the full HLS handling
        try {
          hls.destroy();
        } catch (_e) {
          // ignore
        }
        createAndAttachHls(player, videoEl, srcUrl);
        attachNativeErrorHandler(player, videoEl, srcUrl);
        resolve(true);
      }
    });

    hls.on(Hls.Events.ERROR, (_event: unknown, data: ErrorData) => {
      if (!resolved && data?.fatal) {
        resolved = true;
        clearTimeout(timeout);
        try {
          hls.destroy();
        } catch (_e) {
          // ignore
        }
        resolve(false);
      }
    });

    hls.loadSource(srcUrl);
    hls.attachMedia(videoEl);
  });
};

export const tryLoadHlsWithVariations = async (
  player: Player,
  videoEl: HTMLVideoElement,
  baseUrl: string,
  createAndAttachHls: (
    player: Player,
    videoEl: HTMLVideoElement,
    srcUrl: string,
  ) => Hls,
  attachNativeErrorHandler: (
    player: Player,
    videoEl: HTMLVideoElement,
    srcUrl: string,
  ) => void,
): Promise<boolean> => {
  const urlVariations = getHlsUrlVariations(baseUrl);

  for (const url of urlVariations) {
    try {
      console.log(`Trying HLS URL: ${url}`);
      const success = await tryLoadSingleHlsUrl(
        player,
        videoEl,
        url,
        createAndAttachHls,
        attachNativeErrorHandler,
      );
      if (success) {
        console.log(`Successfully loaded HLS from: ${url}`);
        return true;
      }
    } catch (error) {
      console.log(`Failed to load HLS from: ${url}`, error);
      continue;
    }
  }

  return false;
};
