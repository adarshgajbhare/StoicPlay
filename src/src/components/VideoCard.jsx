/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { formatRelativeTime, getChannelThumbnailUrl, getVideoThumbnailUrl } from "../services/youtubeApi";

function VideoCard({ video, channelDetails }) {
  const [videoImageError, setVideoImageError] = useState(false);
  const [channelImageError, setChannelImageError] = useState(false);

  const handleVideoImageError = () => {
    setVideoImageError(true);
  };

  const handleChannelImageError = () => {
    setChannelImageError(true);
  };

  if (!video?.snippet) {
    return null;
  }

  const getVideoId = () => {
    if (video.id?.videoId) {
      return video.id.videoId;
    }
    if (video.snippet?.resourceId?.videoId) {
      return video.snippet.resourceId.videoId;
    }
    if (typeof video.id === "string") {
      return video.id;
    }
    if (video.contentDetails?.videoId) {
      return video.contentDetails.videoId;
    }
    return null;
  };

  const handleClick = () => {
    const videoId = getVideoId();
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
    } else {
      console.error("Could not determine video ID:", video);
    }
  };


  // Get channel thumbnail, title, and verified status (if available)
  const channelTitle =
    channelDetails?.snippet?.title || video.snippet.channelTitle;

  return (
    <div
      className="bg-black ring-[1px] ring-white/20 rounded-md overflow-hidden shadow-md md:transition-transform duration-500 md:hover:scale-105 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative group">
        {/* Video Thumbnail with Error Handling */}
        {!videoImageError ? (
          <img
            src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
            alt={video.snippet.title}
            className="w-full h-48 object-cover"
            onError={handleVideoImageError}
          />
        ) : (
          <img
            src="/placeholder.png"
            alt="Placeholder"
            className="w-full h-48 object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-500 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg/5 tracking-tight mb-2 line-clamp-2 text-white">
          {video.snippet.title}
        </h3>
        <div className="flex items-center mb-2">
          {/* Channel Image with Error Handling */}
          {!channelImageError && channelDetails?.snippet?.thumbnails && (
            <img
              src={getChannelThumbnailUrl(channelDetails.snippet.thumbnails)}
              alt={channelTitle}
              className="size-8 rounded-full ring-[1px] ring-white/20 mr-2 overflow-hidden border-white"
              onError={handleChannelImageError}
            />
          )}
          <span className="text-lg/4 text-white tracking-tight flex items-center">
            {channelTitle}
          </span>

          <p className="text-whtie text-xs mt-1  ml-5">
            {formatRelativeTime(video?.snippet?.publishedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;                                                                                                                                                                                                                                                                                                                                                                          