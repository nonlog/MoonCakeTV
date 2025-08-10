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

              // Load playlist directly (no proxy)
              hls.loadSource(source.src);
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
                    // ignore
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

              // Error handling
              hls.on(
                Hls.Events.ERROR,
                function (_event: unknown, data: ErrorData) {
                  if (process.env.NODE_ENV === "development" && data.fatal) {
                    console.warn("HLS Fatal Error:", data.type, data.details);
                  }

                  if (data.fatal) {
                    switch (data.type) {
                      case Hls.ErrorTypes.NETWORK_ERROR:
                        try {
                          hls.startLoad();
                        } catch (_e) {}
                        break;
                      case Hls.ErrorTypes.MEDIA_ERROR:
                        try {
                          hls.recoverMediaError();
                        } catch (_e) {}
                        break;
                      default:
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
              // Native HLS support (Safari) - load directly
              player.src({ src: source.src, type: "application/x-mpegURL" });
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

        onReady?.(player);
      });

      // Store the player reference
      playerRef.current = player;
    } else {
      const player = playerRef.current;

      player.autoplay(options.autoplay);

      const srcObj = options.sources && options.sources[0];
      if (srcObj && typeof srcObj.src === "string") {
        const isHls = srcObj.src.includes(".m3u8");
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
            } catch (_e) {}
            try {
              hlsRef.current.detachMedia();
            } catch (_e) {}
            hlsRef.current.destroy();
          } catch (_e) {}
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
            hls.loadSource(directSrc);
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
            player.src({ src: directSrc, type: "application/x-mpegURL" });
          } else {
            // Fallback: let video.js handle
            player.src([{ src: directSrc, type: "application/x-mpegURL" }]);
          }
        } else {
          // Non-HLS
          player.src([{ src: directSrc, type: srcObj.type || "video/mp4" }]);
        }
      } else {
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
            } catch (_e) {}
            try {
              hlsRef.current.detachMedia();
            } catch (_e) {}
            hlsRef.current.destroy();
          } catch (_e) {}
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
