"use client";

import React from "react";

import VideoJS from "./video-js";

interface McPlayerProps {
  videoUrl: string;
  poster?: string | null;
}

export const McPlayer = ({ videoUrl, poster }: McPlayerProps) => {
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
        src: videoUrl,
        type: videoUrl.includes(".m3u8")
          ? "application/x-mpegURL"
          : "video/mp4",
      },
    ],
  };

  const handlePlayerReady = (player: any) => {
    console.log("Video.js player ready");

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
      <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
    </div>
  );
};
