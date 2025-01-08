/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  formatRelativeTime,
  getChannelThumbnailUrl,
  getVideoThumbnailUrl,
} from "../services/youtubeApi";
import { IconClock, IconDotsVertical, IconHeart, IconThumbUp, IconTrash } from "@tabler/icons-react";
import DropdownMenu from "./DropdownMenu";
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
import PlaylistVideoCard from "./PlaylistVideoCard";

function VideoCard({ video, channelDetails, variant = "default", onVideoRemoved }) {
  const [channelImageError, setChannelImageError] = useState(false);
  const [videoImageError, setVideoImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const handleClick = () => {
    setIsVideoOpen(true);
  };

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

  return (
    <>
      <div className="bg-transparent overflow-hidden shadow-md md:transition-transform duration-500 cursor-pointer relative">
        <div className="relative group" onClick={handleClick}>
          {!videoImageError ? (
            <div className="relative">
              <img
                src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
                alt={"Video thumbnail"}
                className="w-full h-40 object-cover rounded-md"
                onError={handleVideoImageError}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="white"
                    viewBox="0 0 24 24"
                    className="w-6 h-6"
                  >
                    <path d="M8 5v14l11-7z" />
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

          <div
            className="absolute top-2 right-2 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 rounded-full bg-black/50"
            >
              <IconDotsVertical size={18}
              className="text-white"
              />
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
              src={getChannelThumbnailUrl(channelDetails?.snippet?.thumbnails)}
              alt={channelTitle}
              className="size-8 rounded-full ring-[1px] flex-shrink-0 ring-white/20 mr-1 overflow-hidden border-white"
              onError={handleChannelImageError}
            />
          )}
          <div className="flex flex-col break-words gap-1">
            <h3 className="font-medium  text-pretty text-base/5 line-clamp-2 text-white">
              {video?.snippet?.title}
            </h3>
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-sm/3 text-gray-400 font-medium flex">
                {channelTitle}
              </span>
              <p className="text-gray-400 font-medium text-xs/3 ">
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
