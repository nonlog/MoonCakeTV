/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import Hls, { ErrorData } from "hls.js";
import React, { useEffect } from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";

import "video.js/dist/video-js.css";

import { tryLoadHls } from "./mc-utils";

// Add custom styles for proper video sizing
const videoStyles = `
  .video-js {
    width: 100% !important;
    height: 100% !important;
  }
  .video-js .vjs-tech {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }
  .vjs-fluid {
    padding-top: 0 !important;
  }
`;

// Try loading HLS with URL variations

interface McVideoProps {
  videoJsOptions: any;
  onReady?: (player: Player) => void;
}

export const McVideo = (props: McVideoProps) => {
  const videoRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<Player>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const keydownHandlerRef = React.useRef<((e: KeyboardEvent) => void) | null>(
    null,
  );
  const nativeErrorHandlerRef = React.useRef<((e: Event) => void) | null>(null);
  const lastPlaybackTimeRef = React.useRef<number>(0);
  const retryStateRef = React.useRef({
    networkAttempts: 0,
    mediaRecoverAttempts: 0,
    lastMediaRecoverMs: 0,
    fatalRestarts: 0,
    backoffMs: 1000,
  });
  const { videoJsOptions, onReady } = props;

  const attachNativeErrorHandler = (
    player: Player,
    videoEl: HTMLVideoElement,
    srcUrl: string,
  ) => {
    if (nativeErrorHandlerRef.current) {
      videoEl.removeEventListener("error", nativeErrorHandlerRef.current);
      nativeErrorHandlerRef.current = null;
    }
    const handler = () => {
      const maxNativeRetries = 2;
      const state = retryStateRef.current;
      if (state.networkAttempts >= maxNativeRetries) {
        try {
          (player as any).error?.({
            message: "Playback failed. Please retry.",
          });
        } catch (e: unknown) {
          console.error(e);
        }
        return;
      }
      state.networkAttempts += 1;
      const delayMs = Math.min(
        8000,
        1000 * Math.pow(2, state.networkAttempts - 1),
      );
      setTimeout(() => {
        player.src({ src: srcUrl, type: "application/x-mpegURL" });
        const maybePromise = player.play?.();
        if (maybePromise && typeof (maybePromise as any).catch === "function") {
          (maybePromise as Promise<void>).catch(() => void 0);
        }
      }, delayMs);
    };
    videoEl.addEventListener("error", handler);
    nativeErrorHandlerRef.current = handler;
  };

  const createAndAttachHls = (
    player: Player,
    videoEl: HTMLVideoElement,
    srcUrl: string,
  ): Hls => {
    // reset retry state for new attachment
    retryStateRef.current = {
      networkAttempts: 0,
      mediaRecoverAttempts: 0,
      lastMediaRecoverMs: 0,
      fatalRestarts: 0,
      backoffMs: 1000,
    };

    const hls = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: 30,
      backBufferLength: 30,
      maxBufferSize: 60 * 1000 * 1000,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      // Retry tuning (may be ignored by some hls.js versions)
      manifestLoadingMaxRetry: 2,
      manifestLoadingRetryDelay: 1000,
      levelLoadingMaxRetry: 2,
      levelLoadingRetryDelay: 1000,
      fragLoadingMaxRetry: 2,
      fragLoadingRetryDelay: 1000,
    } as any);

    const restartHls = () => {
      const state = retryStateRef.current;
      if (state.fatalRestarts >= 2) {
        try {
          (player as any).error?.({
            message: "Playback stopped due to repeated errors.",
          });
        } catch (e: unknown) {
          console.error(e);
        }
        return;
      }
      state.fatalRestarts += 1;
      try {
        lastPlaybackTimeRef.current = player.currentTime?.() ?? 0;
      } catch (_e) {
        lastPlaybackTimeRef.current = 0;
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch (_e) {
          // ignore
        }
        hlsRef.current = null;
      }
      const videoEl = player
        .el()
        ?.querySelector("video") as HTMLVideoElement | null;
      if (videoEl) createAndAttachHls(player, videoEl, srcUrl);
    };

    hls.loadSource(srcUrl);
    hls.attachMedia(videoEl);

    const seekToLastTime = () => {
      const t = lastPlaybackTimeRef.current;
      if (!isFinite(t) || t <= 0) return;
      const duration = player.duration();
      if (typeof duration === "number" && duration > t) {
        player.currentTime(t);
      }
    };

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      player.ready(() => {
        (player as any).tech?.().trigger?.("loadstart");
        const progressControl = (player as any).controlBar?.progressControl;
        progressControl?.enable?.();
        seekToLastTime();
      });
    });

    hls.on(Hls.Events.FRAG_LOADED, () => {
      const el = player.el()?.querySelector("video") as HTMLVideoElement | null;
      if (el && el.duration && !isNaN(el.duration)) {
        player.duration(el.duration);
      }
    });

    hls.on(Hls.Events.ERROR, (_event: unknown, data: ErrorData) => {
      const state = retryStateRef.current;
      if (!data?.fatal) {
        return;
      }
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR: {
          if (state.networkAttempts >= 3) {
            state.networkAttempts = 0;
            state.backoffMs = 1000;
            restartHls();
            return;
          }
          state.networkAttempts += 1;
          const delayMs = state.backoffMs;
          state.backoffMs = Math.min(8000, state.backoffMs * 2);
          setTimeout(() => {
            hls.startLoad();
          }, delayMs);
          break;
        }
        case Hls.ErrorTypes.MEDIA_ERROR: {
          const now = Date.now();
          const debounceWindowMs = 5000;
          if (
            state.mediaRecoverAttempts < 3 &&
            now - state.lastMediaRecoverMs > debounceWindowMs
          ) {
            state.mediaRecoverAttempts += 1;
            state.lastMediaRecoverMs = now;
            hls.recoverMediaError();
          } else {
            restartHls();
          }
          break;
        }
        default: {
          restartHls();
        }
      }
    });

    hlsRef.current = hls;
    (videoEl as any).hls = hls;
    return hls;
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current?.appendChild(videoElement);

      // Initialize the Video.js player
      const player: Player = videojs(videoElement, videoJsOptions, () => {
        videojs.log("player is ready");

        // Setup HLS.js - try URL variations if needed
        if (videoJsOptions.sources && videoJsOptions.sources[0]) {
          const source = videoJsOptions.sources[0];

          if (Hls.isSupported()) {
            const initialVideoEl = player
              .el()
              ?.querySelector("video") as HTMLVideoElement | null;
            if (initialVideoEl) {
              tryLoadHls(
                player,
                initialVideoEl,
                source.src,
                createAndAttachHls,
                attachNativeErrorHandler,
              ).then((success) => {
                if (!success) {
                  try {
                    (player as any).error?.({
                      message: "Failed to load video stream.",
                    });
                  } catch (e: unknown) {
                    console.error(e);
                  }
                }
              });
            } else {
              player.one("ready", () => {
                const el = player
                  .el()
                  ?.querySelector("video") as HTMLVideoElement | null;
                if (el) {
                  tryLoadHls(
                    player,
                    el,
                    source.src,
                    createAndAttachHls,
                    attachNativeErrorHandler,
                  ).then((success) => {
                    if (!success) {
                      try {
                        (player as any).error?.({
                          message: "Failed to load video stream.",
                        });
                      } catch (e: unknown) {
                        console.error(e);
                      }
                    }
                  });
                }
              });
            }
          } else if (
            (
              player.el()?.querySelector("video") as HTMLVideoElement | null
            )?.canPlayType?.("application/vnd.apple.mpegurl")
          ) {
            // Native HLS support (Safari) - simple logic
            const hlsUrl = source.src.endsWith(".m3u8")
              ? source.src
              : `${source.src}/index.m3u8`;
            const el = player
              .el()
              ?.querySelector("video") as HTMLVideoElement | null;

            player.src({ src: hlsUrl, type: "application/x-mpegURL" });
            if (el) attachNativeErrorHandler(player, el, hlsUrl);
          } else {
            // No HLS support
            try {
              (player as any).error?.({
                message: "HLS not supported in this browser.",
              });
            } catch (e: unknown) {
              console.error(e);
            }
          }
        }

        // Simple keyboard controls - just arrow keys
        player.ready(() => {
          const playerEl = player.el();
          if (playerEl) {
            playerEl.setAttribute("tabindex", "0");

            const handleKeydown = (e: KeyboardEvent) => {
              if (
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA"
              ) {
                return;
              }

              if (e.key === "ArrowLeft") {
                e.preventDefault();
                const currentTime = player.currentTime() || 0;
                player.currentTime(Math.max(0, currentTime - 10));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                const currentTime = player.currentTime() || 0;
                player.currentTime(currentTime + 10);
              } else if (e.key === " ") {
                e.preventDefault();
                if (player.paused()) {
                  player.play();
                } else {
                  player.pause();
                }
              }
            };

            document.addEventListener("keydown", handleKeydown);
            keydownHandlerRef.current = handleKeydown;
          }
        });

        // Track playback time for resume on restart
        player.on("timeupdate", () => {
          try {
            lastPlaybackTimeRef.current = player.currentTime?.() ?? 0;
          } catch (_e) {
            lastPlaybackTimeRef.current = 0;
          }
        });

        onReady?.(player);
      });

      // Store the player reference
      playerRef.current = player;
    } else {
      const player = playerRef.current;

      player.autoplay(videoJsOptions.autoplay);

      const srcObj = videoJsOptions.sources && videoJsOptions.sources[0];
      if (srcObj && typeof srcObj.src === "string") {
        const directSrc = srcObj.src;
        const videoEl = player
          .el()
          ?.querySelector("video") as HTMLVideoElement | null;

        // If the current source is the same, avoid re-initializing
        const currentSource = player.currentSource() as
          | { src?: string }
          | undefined;
        const currentSrc = currentSource?.src || player.currentSrc();
        if (currentSrc === directSrc) {
          return;
        }

        // If we have an existing Hls instance, destroy before switching
        if (hlsRef.current) {
          try {
            try {
              hlsRef.current.stopLoad();
            } catch (e: unknown) {
              console.error(e);
            }
            try {
              hlsRef.current.detachMedia();
            } catch (e: unknown) {
              console.error(e);
            }
            hlsRef.current.destroy();
          } catch (e: unknown) {
            console.error(e);
          }
          hlsRef.current = null;
          if (videoEl && (videoEl as any).hls) {
            (videoEl as any).hls = null;
          }
        }

        // Try HLS with URL variations
        if (Hls.isSupported()) {
          if (videoEl) {
            tryLoadHls(
              player,
              videoEl,
              directSrc,
              createAndAttachHls,
              attachNativeErrorHandler,
            ).then((success) => {
              if (!success) {
                try {
                  (player as any).error?.({
                    message: "Failed to load video stream.",
                  });
                } catch (e: unknown) {
                  console.error(e);
                }
              }
            });
          } else {
            player.one("ready", () => {
              const el = player
                .el()
                ?.querySelector("video") as HTMLVideoElement | null;
              if (el) {
                tryLoadHls(
                  player,
                  el,
                  directSrc,
                  createAndAttachHls,
                  attachNativeErrorHandler,
                ).then((success) => {
                  if (!success) {
                    try {
                      (player as any).error?.({
                        message: "Failed to load video stream.",
                      });
                    } catch (e: unknown) {
                      console.error(e);
                    }
                  }
                });
              }
            });
          }
        } else if (videoEl?.canPlayType?.("application/vnd.apple.mpegurl")) {
          // Native HLS support (Safari) - simple logic
          const hlsUrl = directSrc.endsWith(".m3u8")
            ? directSrc
            : `${directSrc}/index.m3u8`;
          player.src({ src: hlsUrl, type: "application/x-mpegURL" });
          if (videoEl) attachNativeErrorHandler(player, videoEl, hlsUrl);
        } else {
          try {
            (player as any).error?.({
              message: "HLS not supported in this browser.",
            });
          } catch (e: unknown) {
            console.error(e);
          }
        }
      } else {
        // No source provided
        try {
          (player as any).error?.({ message: "没有视频源" });
        } catch (e: unknown) {
          console.error(e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady, videoJsOptions]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        // Clean up keyboard event listener
        if (keydownHandlerRef.current) {
          document.removeEventListener("keydown", keydownHandlerRef.current);
          keydownHandlerRef.current = null;
        }

        // Clean up HLS instance if it exists
        const videoEl = player
          .el()
          ?.querySelector("video") as HTMLVideoElement | null;
        if (hlsRef.current) {
          try {
            hlsRef.current.stopLoad();
            hlsRef.current.detachMedia();
            hlsRef.current.destroy();
          } catch (e: unknown) {
            console.error(e);
          }
          hlsRef.current = null;
        }
        if (videoEl && (videoEl as any).hls) {
          (videoEl as any).hls = null;
        }
        if (videoEl && nativeErrorHandlerRef.current) {
          videoEl.removeEventListener("error", nativeErrorHandlerRef.current);
          nativeErrorHandlerRef.current = null;
        }

        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: videoStyles }} />
      <div data-vjs-player className='w-full h-full'>
        <div ref={videoRef} className='w-full h-full' />
      </div>
    </>
  );
};
