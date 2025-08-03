import Hls from "hls.js";
import React from "react";
import videojs from "video.js";

import "video.js/dist/video-js.css";

interface VideoJSProps {
  options: any;
  onReady?: (player: unknown) => void;
}

export const VideoJS = (props: VideoJSProps) => {
  const videoRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<any>(null);
  const { options, onReady } = props;

  React.useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current?.appendChild(videoElement);

      // Initialize the Video.js player
      const player = videojs(videoElement, options, () => {
        videojs.log("player is ready");

        // Setup HLS.js if the source is HLS and browser supports it
        if (options.sources && options.sources[0]) {
          const source = options.sources[0];
          if (source.src.includes(".m3u8")) {
            if (Hls.isSupported()) {
              const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                maxBufferLength: 30,
                backBufferLength: 30,
                maxBufferSize: 60 * 1000 * 1000,
              });

              hls.loadSource(source.src);
              hls.attachMedia(player.tech().el() as HTMLVideoElement);

              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videojs.log("HLS manifest loaded");
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
              (player.tech().el() as HTMLVideoElement & { hls: unknown }).hls =
                hls;
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

        onReady && onReady(player);
      });

      // Store the player reference
      playerRef.current = player;

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current as any;

      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [onReady, options, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    const player = playerRef.current as any;

    return () => {
      if (player && !player.isDisposed()) {
        // Clean up HLS instance if it exists
        const videoEl = player.tech()?.el();
        if (videoEl && (videoEl as any).hls) {
          (videoEl as any).hls.destroy();
        }

        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoJS;
