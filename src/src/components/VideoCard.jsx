import React from 'react';

function VideoCard({ video, channelDetails }) {
  if (!video?.snippet) {
    return null;
  }

  const getVideoId = () => {
    // For videos from search results
    if (video.id?.videoId) {
      return video.id.videoId;
    }
    // For videos from playlists
    if (video.snippet?.resourceId?.videoId) {
      return video.snippet.resourceId.videoId;
    }
    // For direct video resources
    if (typeof video.id === 'string') {
      return video.id;
    }
    // For videos in playlist items
    if (video.contentDetails?.videoId) {
      return video.contentDetails.videoId;
    }
    return null;
  };

  const handleClick = () => {
    const videoId = getVideoId();
    if (videoId) {
      // Ensure we're using the correct video ID format for YouTube
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    } else {
      console.error('Could not determine video ID:', video);
    }
  };

  // Get channel thumbnail and title
  const channelThumbnail = channelDetails?.snippet?.thumbnails?.default?.url;
  const channelTitle = channelDetails?.snippet?.title || video.snippet.channelTitle;

  return (
    <div 
      className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer" 
      onClick={handleClick}
    >
      <div className="relative group">
        <img
          src={video.snippet?.thumbnails?.medium?.url || '/placeholder.png'}
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
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-white">
          {video.snippet.title}
        </h3>
        <div className="flex items-center mb-2">
          {channelThumbnail && (
            <img
              src={channelThumbnail}
              alt={channelTitle}
              className="w-6 h-6 rounded-full mr-2"
            />
          )}
          <span className="text-sm text-gray-300">{channelTitle}</span>
        </div>
        <p className="text-sm text-gray-300">
          {new Date(video.snippet.publishedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default VideoCard;

