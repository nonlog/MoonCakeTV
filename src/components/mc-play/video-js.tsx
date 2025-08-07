import Hls from "hls.js";
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

              hls.loadSource(source.src);
              hls.attachMedia(player.tech().el() as HTMLVideoElement);

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
                const videoEl = player.tech().el() as HTMLVideoElement;
                if (videoEl && videoEl.duration && !isNaN(videoEl.duration)) {
                  player.duration(videoEl.duration);
                }
              });

              // Add error handling like in your original code
              hls.on(Hls.Events.ERROR, function (_event: any, data: any) {
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
                      } catch (e) {
                        // Recovery failed, but don't spam console
                      }
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      // Silently attempt recovery for media errors
                      try {
                        hls.recoverMediaError();
                      } catch (e) {
                        // Recovery failed, but don't spam console
                      }
                      break;
                    default:
                      // Only destroy HLS instance, don't log unrecoverable errors
                      hls.destroy();
                      break;
                  }
                }
              });

              // Store HLS instance for cleanup
              (player.tech().el() as HTMLVideoElement).hls = hls;
            } else if (
              (player.tech().el() as HTMLVideoElement).canPlayType(
                "application/vnd.apple.mpegurl",
              )
            ) {
              // Native HLS support (Safari)
              player.src(source.src);
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

      player.autoplay(options.autoplay);
      player.src(options.sources);
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
        const videoEl = player.tech()?.el() as HTMLVideoElement;
        if (videoEl && videoEl.hls) {
          videoEl.hls.destroy();
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
