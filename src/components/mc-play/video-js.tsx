import Hls, { ErrorData } from "hls.js";
import React from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";

import "video.js/dist/video-js.css";

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

interface VideoJSProps {
  options: any;
  onReady?: (player: Player) => void;
}

export const VideoJS = (props: VideoJSProps) => {
  const videoRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<Player>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const keydownHandlerRef = React.useRef<((e: KeyboardEvent) => void) | null>(
    null,
  );
  const { options, onReady } = props;

  React.useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current?.appendChild(videoElement);

      // Initialize the Video.js player
      const toProxyUrl = (url: string) => {
        try {
          const u = new URL(
            url,
            typeof window !== "undefined" ? window.location.href : undefined,
          );
          const isHttp = u.protocol === "http:" || u.protocol === "https:";
          const isAlreadyProxied =
            u.pathname.startsWith("/api/proxy/hls") &&
            u.searchParams.has("url");
          if (!isHttp || isAlreadyProxied) return url;
          return `/api/proxy/hls?url=${encodeURIComponent(u.toString())}`;
        } catch {
          return url;
        }
      };

      const player: Player = videojs(videoElement, options, () => {
        videojs.log("player is ready");

        // Setup HLS.js if the source is HLS and browser supports it
        if (options.sources && options.sources[0]) {
          const source = options.sources[0];
          if (source.src.includes(".m3u8")) {
            if (Hls.isSupported()) {
              const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: false, // Disable for better seeking
                maxBufferLength: 30,
                backBufferLength: 30,
                maxBufferSize: 60 * 1000 * 1000,
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 10,
              });

              // Load playlist via proxy to bypass CORS/GFW
              hls.loadSource(toProxyUrl(source.src));
              const initialVideoEl = player
                .el()
                ?.querySelector("video") as HTMLVideoElement | null;
              if (initialVideoEl) {
                hls.attachMedia(initialVideoEl);
              } else {
                player.one("ready", () => {
                  const el = player
                    .el()
                    ?.querySelector("video") as HTMLVideoElement | null;
                  if (el) hls.attachMedia(el);
                });
              }

              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videojs.log("HLS manifest loaded");
                // Enable seeking after manifest is loaded
                player.ready(() => {
                  player.tech().trigger("loadstart");
                  // Ensure the progress bar is interactive
                  try {
                    const progressControl = (player as any).controlBar
                      ?.progressControl;
                    if (progressControl) {
                      progressControl.enable();
                    }
                  } catch (e) {
                    // Progress control setup failed, but continue
                  }
                });
              });

              // Handle seeking events for better scrubbing
              hls.on(Hls.Events.FRAG_LOADED, () => {
                // Update player duration and enable seeking
                const videoEl = player
                  .el()
                  ?.querySelector("video") as HTMLVideoElement | null;
                if (videoEl && videoEl.duration && !isNaN(videoEl.duration)) {
                  player.duration(videoEl.duration);
                }
              });

              // Add error handling like in your original code
              hls.on(
                Hls.Events.ERROR,
                function (_event: unknown, data: ErrorData) {
                  // Only log in development and for fatal errors
                  if (process.env.NODE_ENV === "development" && data.fatal) {
                    console.warn("HLS Fatal Error:", data.type, data.details);
                  }

                  if (data.fatal) {
                    switch (data.type) {
                      case Hls.ErrorTypes.NETWORK_ERROR:
                        // Silently attempt recovery for network errors
                        try {
                          hls.startLoad();
                        } catch (_e) {
                          // ignore
                        }
                        break;
                      case Hls.ErrorTypes.MEDIA_ERROR:
                        // Silently attempt recovery for media errors
                        try {
                          hls.recoverMediaError();
                        } catch (_e) {
                          // ignore
                        }
                        break;
                      default:
                        // Only destroy HLS instance, don't log unrecoverable errors
                        hls.destroy();
                        break;
                    }
                  }
                },
              );

              // Store HLS instance for cleanup
              if (initialVideoEl) (initialVideoEl as any).hls = hls;
              hlsRef.current = hls;
            } else if (
              (
                player.el()?.querySelector("video") as HTMLVideoElement | null
              )?.canPlayType?.("application/vnd.apple.mpegurl")
            ) {
              // Native HLS support (Safari) - still proxy to avoid CORS/GFW
              player.src(toProxyUrl(source.src));
            }
          }
        }

        // Simple keyboard controls - just arrow keys
        player.ready(() => {
          const playerEl = player.el();
          if (playerEl) {
            // Make sure the player can receive focus
            playerEl.setAttribute("tabindex", "0");

            // Add global keyboard listener for arrow keys
            const handleKeydown = (e: KeyboardEvent) => {
              // Only handle if no input is focused
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

            // Add to document to catch all keyboard events
            document.addEventListener("keydown", handleKeydown);

            // Store the handler for cleanup
            keydownHandlerRef.current = handleKeydown;
          }
        });

        onReady?.(player);
      });

      // Store the player reference
      playerRef.current = player;

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current;
      const toProxyUrl = (url: string) => {
        try {
          const u = new URL(
            url,
            typeof window !== "undefined" ? window.location.href : undefined,
          );
          const isHttp = u.protocol === "http:" || u.protocol === "https:";
          const isAlreadyProxied =
            u.pathname.startsWith("/api/proxy/hls") &&
            u.searchParams.has("url");
          if (!isHttp || isAlreadyProxied) return url;
          return `/api/proxy/hls?url=${encodeURIComponent(u.toString())}`;
        } catch {
          return url;
        }
      };

      player.autoplay(options.autoplay);

      const srcObj = options.sources && options.sources[0];
      if (srcObj && typeof srcObj.src === "string") {
        const isHls = srcObj.src.includes(".m3u8");
        const proxiedSrc = toProxyUrl(srcObj.src);
        const videoEl = player
          .el()
          ?.querySelector("video") as HTMLVideoElement | null;

        // If the current source is the same, avoid re-initializing
        const currentSource = player.currentSource() as
          | { src?: string }
          | undefined;
        const currentSrc = currentSource?.src || player.currentSrc();
        if (currentSrc === proxiedSrc) {
          return;
        }

        // If we have an existing Hls instance, destroy before switching
        if (hlsRef.current) {
          try {
            // Stop and detach before destroy to avoid decode errors
            try {
              hlsRef.current.stopLoad();
            } catch (_e) {
              void 0;
            }
            try {
              hlsRef.current.detachMedia();
            } catch (_e) {
              void 0;
            }
            hlsRef.current.destroy();
          } catch (_e) {
            void 0;
          }
          hlsRef.current = null;
          if (videoEl && (videoEl as any).hls) {
            (videoEl as any).hls = null;
          }
        }

        if (isHls) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 30,
              backBufferLength: 30,
              maxBufferSize: 60 * 1000 * 1000,
              liveSyncDurationCount: 3,
              liveMaxLatencyDurationCount: 10,
            });
            hls.loadSource(proxiedSrc);
            if (videoEl) {
              hls.attachMedia(videoEl);
              (videoEl as any).hls = hls;
            } else {
              player.one("ready", () => {
                const el = player
                  .el()
                  ?.querySelector("video") as HTMLVideoElement | null;
                if (el) {
                  hls.attachMedia(el);
                  (el as any).hls = hls;
                }
              });
            }
            hlsRef.current = hls;
          } else if (videoEl?.canPlayType?.("application/vnd.apple.mpegurl")) {
            player.src({ src: proxiedSrc, type: "application/x-mpegURL" });
          } else {
            // Fallback: let video.js handle
            player.src([{ src: proxiedSrc, type: "application/x-mpegURL" }]);
          }
        } else {
          // Non-HLS, ensure proxying for CORS/GFW
          player.src([{ src: proxiedSrc, type: srcObj.type || "video/mp4" }]);
        }
      } else {
        // Fallback to original behavior
        player.src(options.sources);
      }
    }
  }, [onReady, options, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
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
            try {
              hlsRef.current.stopLoad();
            } catch (_e) {
              void 0;
            }
            try {
              hlsRef.current.detachMedia();
            } catch (_e) {
              void 0;
            }
            hlsRef.current.destroy();
          } catch (_e) {
            void 0;
          }
          hlsRef.current = null;
        }
        if (videoEl && (videoEl as any).hls) {
          (videoEl as any).hls = null;
        }

        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: videoStyles }} />
      <div data-vjs-player className='w-full h-full'>
        <div ref={videoRef} className='w-full h-full' />
      </div>
    </>
  );
};

export default VideoJS;
