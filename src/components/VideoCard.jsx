/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  formatRelativeTime,
  getChannelThumbnailUrl,
  getVideoThumbnailUrl,
} from "../services/youtubeApi";
import { IconBookmark, IconClock, IconHeart, IconThumbUp, IconTrash } from "@tabler/icons-react";
import {
  saveLikedVideo,
  saveWatchLater,
  removeWatchLaterVideo,
  getLikedVideos,
  removeLikedVideo,
  getWatchLaterVideos,
} from "../utils/constant";
import { useAuth } from "../contexts/AuthContext";
import VideoPlayer from "./VideoPlayer";

function VideoCard({ video, channelDetails, variant = "default", onVideoRemoved }) {
  const [channelImageError, setChannelImageError] = useState(false);
  const [videoImageError, setVideoImageError] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);

  const handleVideoImageError = () => {
    setVideoImageError(true);
  };

  const handleChannelImageError = () => {
    setChannelImageError(true);
  };

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

  useEffect(() => {
    const checkIfLiked = async () => {
      if (user?.uid && video?.id) {
        const likedVideos = await getLikedVideos(user.uid);
        const videoIdToCheck = getVideoId();
        setIsLiked(likedVideos.some((likedVideo) => (likedVideo.id?.videoId || likedVideo.id) === videoIdToCheck));
      } else {
        setIsLiked(false);
      }
    };

    const checkIfWatchLater = async () => {
      if (user?.uid && video?.id) {
        const watchLaterVideos = await getWatchLaterVideos(user.uid);
        const videoIdToCheck = getVideoId();
        setIsWatchLater(watchLaterVideos.some((watchLaterVideo) => (watchLaterVideo.id?.videoId || watchLaterVideo.id) === videoIdToCheck));
      } else {
        setIsWatchLater(false);
      }
    };

    checkIfLiked();
    checkIfWatchLater();
  }, [user?.uid, video?.id]);

  if (!video?.snippet) {
    return null;
  }

  const handleLikeVideo = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user?.uid) return; // Ensure user is logged in

    try {
      const videoIdToSave = getVideoId();
      const likedVideos = await getLikedVideos(user.uid);
      const alreadyLiked = likedVideos.some((likedVideo) => (likedVideo.id?.videoId || likedVideo.id) === videoIdToSave);

      if (alreadyLiked) {
        console.log("Video already liked.");
        return; // Prevent duplicate addition
      }

      const videoToSave = {
        ...video,
        channelDetails,
        id: videoIdToSave,
        snippet: {
          ...video.snippet,
          thumbnails: video.snippet.thumbnails || {},
          channelTitle:
            channelDetails?.snippet?.title || video.snippet.channelTitle,
        },
      };

      await saveLikedVideo(user.uid, videoToSave);
      setIsLiked(true);
      console.log("Video liked:", videoIdToSave);
    } catch (error) {
      console.error("Failed to save liked video:", error);
    }

    setIsMenuOpen(false);
  };

  const handleRemoveLikedVideo = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const videoIdToRemove = getVideoId();
      await removeLikedVideo(user.uid, videoIdToRemove);
      setIsLiked(false);
      console.log('Removed from liked videos:', videoIdToRemove);
      if (onVideoRemoved) {
        onVideoRemoved(videoIdToRemove);
      }
    } catch (error) {
      console.error('Failed to remove from liked videos', error);
    }
    setIsMenuOpen(false);
  };

  const handleRemoveWatchLater = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const videoId = getVideoId();
      await removeWatchLaterVideo(user.uid, videoId);
      setIsWatchLater(false);
      console.log('removed from watch later:', videoId);
      if (onVideoRemoved) {
        onVideoRemoved(videoId);
      }
    } catch (error) {
      console.log('Failed to remove from watch later', error);
    }
    setIsMenuOpen(false);
  };

  const handleWatchLater = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user?.uid) return; // Ensure user is logged in

    try {
      const videoIdToSave = getVideoId();
      const watchLaterVideos = await getWatchLaterVideos(user.uid);
      const alreadyInWatchLater = watchLaterVideos.some((watchLaterVideo) => (watchLaterVideo.id?.videoId || watchLaterVideo.id) === videoIdToSave);

      if (alreadyInWatchLater) {
        console.log("Video already in watch later.");
        return; // Prevent duplicate addition
      }

      const videoToSave = {
        ...video,
        channelDetails,
        id: videoIdToSave,
        snippet: {
          ...video.snippet,
          thumbnails: video.snippet.thumbnails || {},
          channelTitle:
            channelDetails?.snippet?.title || video.snippet.channelTitle,
        },
      };

      await saveWatchLater(user.uid, videoToSave);
      setIsWatchLater(true);
      console.log("Added to watch later:", videoIdToSave);
    } catch (error) {
      console.error("Failed to save to watch later:", error);
    }

    setIsMenuOpen(false);
  };

  let menuItems = [
    [
      {
        label: isWatchLater ? "Remove from Watch Later" : "Watch Later",
        icon: isWatchLater ? <IconTrash size={20} /> : <IconClock size={20} />,
        onClick: isWatchLater ? handleRemoveWatchLater : handleWatchLater,
      },
      {
        label: isLiked ? "Remove from Liked Videos" : "Like Video",
        icon: isLiked ? <IconTrash size={20} /> : <IconThumbUp size={20} />,
        onClick: isLiked ? handleRemoveLikedVideo : handleLikeVideo,
      },
    ],
  ];

  // const handleClick = () => {
  //   setIsVideoOpen(true);
  // };

  const channelTitle =
    channelDetails?.snippet?.title || video?.snippet?.channelTitle;

  if (variant === "playlist") {
    return (
      <PlaylistVideoCard
        video={video}
        channelDetails={channelDetails}
        onMenuOpen={setIsMenuOpen}
        isMenuOpen={isMenuOpen}
        menuItems={menuItems}
        onVideoClick={handleClick}
        videoImageError={videoImageError}
        onVideoImageError={handleVideoImageError}
        channelImageError={channelImageError}
        onChannelImageError={handleChannelImageError}
        getVideoId={getVideoId}
      />
    );
  }
  const handleClick = () => {
    setIsVideoOpen(true);
  };

  // const channelTitle =
  //   channelDetails?.snippet?.title || video?.snippet?.channelTitle;

  if (variant === "playlist") {
    return (
      <PlaylistVideoCard
        video={video}
        channelDetails={channelDetails}
        onMenuOpen={setIsMenuOpen}
        isMenuOpen={isMenuOpen}
        menuItems={menuItems}
        onVideoClick={handleClick}
        videoImageError={videoImageError}
        onVideoImageError={handleVideoImageError}
        channelImageError={channelImageError}
        onChannelImageError={handleChannelImageError}
        getVideoId={getVideoId}
      />
    );
  }

  return (
    <>
      <div className="group bg-[#1a1a1a]  rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer">
        <div className="relative aspect-video" onClick={() => setIsVideoOpen(true)}>
          {!videoImageError ? (
            <div className="relative w-full h-full">
              <img
                src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
                alt={video?.snippet?.title}
                className="w-full h-full object-cover"
                onError={() => setVideoImageError(true)}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-black/60 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="white"
                    viewBox="0 0 24 24"
                    className="w-7 h-7"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-500">No thumbnail available</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex gap-3">
            {!channelImageError && channelDetails?.snippet?.thumbnails && (
              <img
                src={getChannelThumbnailUrl(channelDetails?.snippet?.thumbnails)}
                alt={channelDetails?.snippet?.title || video?.snippet?.channelTitle}
                className="w-10 h-10 rounded-full ring-1 ring-white/10 object-cover flex-shrink-0"
                onError={() => setChannelImageError(true)}
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-base line-clamp-2 mb-1">
                {video?.snippet?.title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm font-medium">
                    {channelDetails?.snippet?.title || video?.snippet?.channelTitle}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {formatRelativeTime(video?.snippet?.publishedAt)}
                  </span>
                </div>
                <div className="flex gap-">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      isWatchLater ? handleRemoveWatchLater(e) : handleWatchLater(e);
                    }}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    title={isWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
                  >
                    <IconBookmark
                      size={24}
                      className={`${isWatchLater ? 'text-blue-500' : 'text-gray-400'} transition-colors`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      isLiked ? handleRemoveLikedVideo(e) : handleLikeVideo(e);
                    }}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <IconThumbUp
                      size={24}
                      className={`${isLiked ? 'text-red-500' : 'text-gray-400'} transition-colors`}
                    />
                  </button>
                </div>
              </div>
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

