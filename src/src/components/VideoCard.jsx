/* eslint-disable react/prop-types */
import React from 'react';
import { formatRelativeTime } from '../services/youtubeApi';

function VideoCard({ video, channelDetails }) {
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
    if (typeof video.id === 'string') {
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
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    } else {
      console.error('Could not determine video ID:', video);
    }
  };

  // Get channel thumbnail, title, and verified status (if available)
  const channelThumbnail = channelDetails?.snippet?.thumbnails?.default?.url;
  const channelTitle = channelDetails?.snippet?.title || video.snippet.channelTitle;
  const isVerified = channelDetails?.badges?.includes("VERIFIED"); // Assuming you have this info

  // Function to format the published date/time
  const formatPublishedAt = (publishedAt) => {
    const now = new Date();
    const publishedDate = new Date(publishedAt);
    const diffInSeconds = Math.floor((now - publishedDate) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    // If more than a week, return the formatted date
    return publishedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  

//  console.log("!!!!!!!!!!!!",video?.snippet?.publishedAt);


  return (
    <div
      className="bg-black ring-[1px] ring-white/20 rounded-md overflow-hidden shadow-md transition-transform duration-500 hover:scale-105 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative group">
        <img
          src={video?.snippet?.thumbnails?.high?.url || '/placeholder.png'}
          alt={video.snippet.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
          {channelDetails?.snippet?.thumbnails?.high?.url && (
            <img
              src={channelDetails?.snippet?.thumbnails?.high?.url}
              alt={channelTitle}
              className="size-8 rounded-full ring-[1px] ring-white/20 mr-2 overflow-hidden border-white"
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