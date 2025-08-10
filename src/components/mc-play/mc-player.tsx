"use client";

import React from "react";
import type Player from "video.js/dist/types/player";

import VideoJS from "./video-js";

interface McPlayerProps {
  videoUrl: string;
  poster?: string | null;
}

export const McPlayer = ({ videoUrl, poster }: McPlayerProps) => {
  const toProxyUrl = (url: string) => {
    try {
      const u = new URL(
        url,
        typeof window !== "undefined" ? window.location.href : undefined,
      );
      const isHttp = u.protocol === "http:" || u.protocol === "https:";
      const isAlreadyProxied =
        u.pathname.startsWith("/api/proxy/hls") && u.searchParams.has("url");
      if (!isHttp || isAlreadyProxied) return url;
      return `/api/proxy/hls?url=${encodeURIComponent(u.toString())}`;
    } catch {
      return url;
    }
  };

  // Video.js options configuration
  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    poster: poster || "",
    preload: "metadata",
    liveui: false,
    // Enable keyboard controls
    keyboard: {
      volumeStep: 0.1,
      seekStep: 5,
      enableModifiersForNumbers: false,
    },
    sources: [
      {
        // For MP4 or non-HLS, route through proxy to bypass CORS/GFW
        // For HLS, keep original; Hls.js will proxy requests internally in VideoJS component
        src: videoUrl.includes(".m3u8") ? videoUrl : toProxyUrl(videoUrl),
        type: videoUrl.includes(".m3u8")
          ? "application/x-mpegURL"
          : "video/mp4",
      },
    ],
  };

  const handlePlayerReady = (player: Player) => {
    console.log("Video.js player ready");

    // Auto play the video when ready
    player.play()?.catch((error: unknown) => {
      console.warn("Autoplay failed:", error);
    });

    player.on("loadedmetadata", () => {
      console.log(player.duration());
    });

    // You can add any additional player setup here
    player.on("error", (err: unknown) => {
      console.error("Player error:", err);
    });
  };

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
      <VideoJS
        key={videoUrl}
        options={videoJsOptions}
        onReady={handlePlayerReady}
      />
    </div>
  );
};
