/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  formatRelativeTime,
  getChannelThumbnailUrl,
  getVideoThumbnailUrl,
} from "../services/youtubeApi";
import { IconClock, IconDotsVertical, IconHeart } from "@tabler/icons-react";
import DropdownMenu from "./DropdownMenu";

function VideoCard({ video, channelDetails }) {
  const [videoImageError, setVideoImageError] = useState(false);
  const [channelImageError, setChannelImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleLikeVideo = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const likedVideos = JSON.parse(localStorage.getItem('likedVideos') || '[]');
      const videoId = video.id?.videoId || video.id;
      
      const isAlreadyLiked = likedVideos.some(v => 
        v.id?.videoId === videoId || v.id === videoId
      );
    
      if (!isAlreadyLiked) {
        const videoToSave = {
          ...video,
          channelDetails,
          id: videoId,
          snippet: {
            ...video.snippet,
            thumbnails: video.snippet.thumbnails || {},
            channelTitle: channelDetails?.snippet?.title || video.snippet.channelTitle
          }
        };
        
        const updatedLikedVideos = [...likedVideos, videoToSave];
        localStorage.setItem('likedVideos', JSON.stringify(updatedLikedVideos));
        console.log('Video liked:', videoId);
      }
    } catch (error) {
      console.error('Failed to save liked video:', error);
    }
    
    setIsMenuOpen(false);
  };

  const handleWatchLater = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const watchLaterVideos = JSON.parse(localStorage.getItem('watchLaterVideos') || '[]');
      const videoId = video.id?.videoId || video.id;
      
      const isAlreadyAdded = watchLaterVideos.some(v => 
        v.id?.videoId === videoId || v.id === videoId
      );
    
      if (!isAlreadyAdded) {
        const videoToSave = {
          ...video,
          channelDetails,
          id: videoId,
          snippet: {
            ...video.snippet,
            thumbnails: video.snippet.thumbnails || {},
            channelTitle: channelDetails?.snippet?.title || video.snippet.channelTitle
          }
        };
    
        localStorage.setItem('watchLaterVideos', 
          JSON.stringify([...watchLaterVideos, videoToSave])
        );
        console.log('Added to watch later:', videoId);
      }
    } catch (error) {
      console.error('Failed to save to watch later:', error);
    }
    
    setIsMenuOpen(false);
  };

  const menuItems = [
    [
      {
        label: "Watch Later",
        icon: <IconClock size={20} />,
        onClick: handleWatchLater,
      },
      {
        label: "Like Video",
        icon: <IconHeart size={20} />,
        onClick: handleLikeVideo,
      },
    ],
  ];

  const handleClick = () => {
    const videoId = getVideoId();
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
    } else {
      console.error("Could not determine video ID:", video);
    }
  };

  const channelTitle = channelDetails?.snippet?.title || video.snippet.channelTitle;

  return (
    <div
      className="bg-transparent overflow-hidden shadow-md md:transition-transform duration-500 cursor-pointer relative"
      onClick={handleClick}
    >
      <div className="relative group">
        {!videoImageError ? (
          <img
            src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
            alt={video.snippet.title}
            className="w-full h-40 object-cover rounded-md"
            onError={handleVideoImageError}
          />
        ) : (
          <img
            src="/placeholder.png"
            alt="Placeholder"
            className="w-full h-40 object-cover rounded-md"
          />
        )}

        <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 
                       opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <IconDotsVertical size={20} />
          </button>

          <DropdownMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            items={menuItems}
          />
        </div>
      </div>

      <div className="flex items-start mt-2 gap-1">
        {!channelImageError && channelDetails?.snippet?.thumbnails && (
          <img
            src={getChannelThumbnailUrl(channelDetails.snippet.thumbnails)}
            alt={channelTitle}
            className="size-8 rounded-full ring-[1px] flex-shrink-0 ring-white/20 mr-1 overflow-hidden border-white"
            onError={handleChannelImageError}
          />
        )}
        <div className="flex flex-col break-words gap-1">
          <h3 className="font-semibold text-pretty text-base/5 line-clamp-2 text-white">
            {video.snippet.title}
          </h3>
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-sm/3 text-gray-500 font-medium flex">
              {channelTitle}
            </span>
            <p className="text-white font-medium text-xs/3 ">
              {formatRelativeTime(video?.snippet?.publishedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;