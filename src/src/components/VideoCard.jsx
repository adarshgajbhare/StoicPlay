/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  formatRelativeTime,
  getChannelThumbnailUrl,
  getVideoThumbnailUrl,
} from "../services/youtubeApi";
import { IconBookmark, IconClock, IconDotsVertical, IconThumbUp } from "@tabler/icons-react";
import DropdownMenu from "./DropdownMenu";
import { saveLikedVideo, saveWatchLater } from '../utils/constant';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from './VideoPlayer';

function VideoCard({ video, channelDetails }) {
  const [channelImageError, setChannelImageError] = useState(false);
  const [videoImageError, setVideoImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const { user } = useAuth();

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

  const handleLikeVideo = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const videoId = video.id?.videoId || video.id;
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
      
      await saveLikedVideo(user.uid, videoToSave);
      console.log('Video liked:', videoId);
    } catch (error) {
      console.error('Failed to save liked video:', error);
    }
    
    setIsMenuOpen(false);
  };

  const handleWatchLater = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const videoId = video.id?.videoId || video.id;
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
      
      await saveWatchLater(user.uid, videoToSave);
      console.log('Added to watch later:', videoId);
    } catch (error) {
      console.error('Failed to save to watch later:', error);
    }
    
    setIsMenuOpen(false);
  };

  const menuItems = [
    [
      {
        label: "Watch later",
        icon: <IconClock size={20} />,
        onClick: handleWatchLater,
      },
      {
        label: "Like video",
        icon: <IconThumbUp size={20} />,
        onClick: handleLikeVideo,
      },
      {
        label: "Save for later",
        icon: <IconBookmark size={20} />,
        onClick: handleLikeVideo,
      },
    ],
  ];

  const handleClick = () => {
    setIsVideoOpen(true);
  };

  const channelTitle = channelDetails?.snippet?.title || video.snippet.channelTitle;

  return (
    <div
      className="bg-transparent  flex items-start gap-4 overflow-hidden shadow-md md:transition-transform duration-500 cursor-pointer relative"
      onClick={handleClick}
    >
      <div className="relative group flex-shrink-0">
        {!videoImageError ? (
          <img
            src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
            alt={video.snippet.title}
            className="h-36 w-60   rounded-lg  flex-shrink-0"
            onError={handleVideoImageError}
          />
        ) : (
          <img
            src="/placeholder.png"
            alt="Placeholder"
            className="w-full h-40 object-cover rounded "
          />
        )}

        <div className="absolute top-1 right-1 z-20" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 rounded-full bg-black/50 hover:bg-black 
                       transition-opacity"
          >
            <IconDotsVertical size={16} />
          </button>

            <DropdownMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              items={menuItems}
            />
          </div>
        </div>

      <div className="flex items-start self-stretch  w-full gap-2">
        {!channelImageError && channelDetails?.snippet?.thumbnails && (
          <div className="size-8 rounded-full ring-[1px]  ring-white/20  overflow-hidden border-white flex-shrink-0">
            <img
              src={getChannelThumbnailUrl(channelDetails.snippet.thumbnails)}
              alt={channelTitle}
              className=""
              onError={handleChannelImageError}
            />
          </div>
        )}
        <div className="flex flex-col break-words gap-1.5">
          <h3 className="font-medium  text-pretty text-lg/5 line-clamp-3 text-white">
            {video.snippet.title}
          </h3>
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-sm/3 text-gray-300 font-medium flex">
              {channelTitle}
            </span>
            <p className="text-gray-300 fostretchnt-medium text-xs/3">
              {formatRelativeTime(video?.snippet?.publishedAt)}
            </p>
          </div>
        </div>
      </div>

      {isVideoOpen && (
        <VideoPlayer
          videoId={getVideoId()}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </div>
  );
}

export default VideoCard;