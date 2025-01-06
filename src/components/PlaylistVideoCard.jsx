import React from 'react';
import { IconDotsVertical } from "@tabler/icons-react";
import DropdownMenu from "./DropdownMenu";
import {
  formatRelativeTime,
  getChannelThumbnailUrl,
  getVideoThumbnailUrl,
} from "../services/youtubeApi";

function PlaylistVideoCard({
  video,
  channelDetails,
  onMenuOpen,
  isMenuOpen,
  menuItems,
  onVideoClick,
  videoImageError,
  onVideoImageError,
  channelImageError,
  onChannelImageError,
  getVideoId
}) {
  const channelTitle = channelDetails?.snippet?.title || video.snippet.channelTitle;

  return (
    <div
      className="flex gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/10 group"
      onClick={onVideoClick}
    >
      <div className="relative flex-shrink-0">
        {!videoImageError ? (
          <img
            src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
            alt={video.snippet.title}
            className="w-32 h-18 object-cover rounded"
            onError={onVideoImageError}
          />
        ) : (
          <div className="w-32 h-18 bg-gray-800 rounded flex items-center justify-center">
            <span className="text-gray-500">No thumbnail</span>
          </div>
        )}
        {video.contentDetails?.duration && (
          <div className="absolute bottom-1 right-1 bg-black/80 px-1 text-xs rounded">
            {video.contentDetails.duration}
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0">
        <h3 className="text-sm font-medium line-clamp-2 text-white">
          {video.snippet.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {!channelImageError && channelDetails?.snippet?.thumbnails && (
            <img
              src={getChannelThumbnailUrl(channelDetails.snippet.thumbnails)}
              alt={channelTitle}
              className="w-5 h-5 rounded-full"
              onError={onChannelImageError}
            />
          )}
          <p className="text-xs text-[#AAAAAA]">{channelTitle}</p>
        </div>
        <p className="text-xs text-[#AAAAAA] mt-1">
          {formatRelativeTime(video?.snippet?.publishedAt)}
        </p>
      </div>

      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.preventDefault();
            onMenuOpen(!isMenuOpen);
          }}
          className="p-1.5 rounded-full hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <IconDotsVertical size={20} className="text-white" />
        </button>

        <DropdownMenu
          isOpen={isMenuOpen}
          onClose={() => onMenuOpen(false)}
          items={menuItems}
        />
      </div>
    </div>
  );
}

export default PlaylistVideoCard;

