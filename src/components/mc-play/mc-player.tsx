'use client';

import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

interface McPlayerProps {
  videoUrl: string;
  poster?: string | null;
}

export const McPlayer = ({ videoUrl, poster }: McPlayerProps) => {
  const artPlayerRef = useRef<any>(null);
  const artRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!Artplayer || !Hls || !videoUrl || !artRef.current) {
      return;
    }

    // Destroy previous player instance
    if (artPlayerRef.current) {
      if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
        artPlayerRef.current.video.hls.destroy();
      }
      artPlayerRef.current.destroy();
      artPlayerRef.current = null;
    }

    try {
      // Create new player instance
      Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2];
      Artplayer.USE_RAF = true;

      artPlayerRef.current = new Artplayer({
        container: artRef.current,
        url: videoUrl,
        poster: poster || '',
        volume: 0.7,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: false,
        mutex: true,
        playsInline: true,
        autoPlayback: false,
        airplay: true,
        theme: '#22c55e',
        lang: 'zh-cn',
        hotkey: true,
        fastForward: true,
        autoOrientation: true,
        lock: true,
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
        // HLS support configuration
        customType: {
          m3u8: function (video: HTMLVideoElement, url: string) {
            if (!Hls) {
              console.error('HLS.js not loaded');
              return;
            }

            if (video.hls) {
              video.hls.destroy();
            }

            const hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: true,
              maxBufferLength: 30,
              backBufferLength: 30,
              maxBufferSize: 60 * 1000 * 1000,
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            video.hls = hls;

            // Ensure video source
            const sources = Array.from(video.getElementsByTagName('source'));
            const existed = sources.some((s) => s.src === url);
            if (!existed) {
              sources.forEach((s) => s.remove());
              const sourceEl = document.createElement('source');
              sourceEl.src = url;
              video.appendChild(sourceEl);
            }

            video.disableRemotePlayback = false;
            if (video.hasAttribute('disableRemotePlayback')) {
              video.removeAttribute('disableRemotePlayback');
            }

            hls.on(Hls.Events.ERROR, function (event: any, data: any) {
              // Only log in development and for fatal errors
              if (process.env.NODE_ENV === 'development' && data.fatal) {
                console.warn('HLS Fatal Error:', data.type, data.details);
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
          },
        },
        icons: {
          loading:
            '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMjUuMjUxIDYuNDYxYy0xMC4zMTggMC0xOC42ODMgOC4zNjUtMTguNjgzIDE4LjY4M2g0LjA2OGMwLTguMDcgNi41NDUtMTQuNjE1IDE0LjYxNS0xNC42MTVWNi40NjF6IiBmaWxsPSIjMDA5Njg4Ij48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgZHVyPSIxcyIgZnJvbT0iMCAyNSAyNSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHRvPSIzNjAgMjUgMjUiIHR5cGU9InJvdGF0ZSIvPjwvcGF0aD48L3N2Zz4=">',
        },
      });

      // Player event listeners
      artPlayerRef.current.on('ready', () => {
        console.log('Player ready');
      });

      artPlayerRef.current.on('error', (err: unknown) => {
        console.error('Player error:', err);
      });
    } catch (err) {
      console.error('Failed to create player:', err);
    }

    // Cleanup on unmount
    return () => {
      if (artPlayerRef.current) {
        if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
          artPlayerRef.current.video.hls.destroy();
        }
        artPlayerRef.current.destroy();
        artPlayerRef.current = null;
      }
    };
  }, [videoUrl, poster]);

  if (!videoUrl) {
    return (
      <div className='bg-black rounded-lg overflow-hidden aspect-video'>
        <div className='flex items-center justify-center h-full text-white'>
          <p>No video available</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-black rounded-lg overflow-hidden aspect-video'>
      <div ref={artRef} className='w-full h-full' />
    </div>
  );
};
