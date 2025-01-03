/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  formatRelativeTime,
  getChannelThumbnailUrl,
  getVideoThumbnailUrl,
} from "../services/youtubeApi";
import { IconClock, IconDotsVertical, IconHeart } from "@tabler/icons-react";
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
    setIsVideoOpen(true);
  };

  const channelTitle = channelDetails?.snippet?.title || video.snippet.channelTitle;

  return (
    <>
      <div className="bg-transparent overflow-hidden shadow-md md:transition-transform duration-500 cursor-pointer relative">
        <div className="relative group" onClick={handleClick}>
          {!videoImageError ? (
            <div className="relative">
              <img
                src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
                alt={video.snippet.title}
                className="w-full h-40 object-cover rounded-md"
                onError={handleVideoImageError}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-6 h-6">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
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
              <p className="text-gray-500 font-medium text-xs/3 ">
                {formatRelativeTime(video?.snippet?.publishedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isVideoOpen && (
        <VideoPlayer
          videoId={getVideoId()}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </>
  );
}

export default VideoCard;