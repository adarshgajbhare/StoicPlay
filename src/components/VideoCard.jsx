/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  formatRelativeTime,
  getChannelThumbnailUrl,
  getVideoThumbnailUrl,
} from "../services/youtubeApi";
import {
  IconBookmark,
  IconClock,
  IconThumbUp,
  IconTrash,
} from "@tabler/icons-react";
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
function VideoCard({
  video,
  channelDetails,
  onVideoRemoved,
}) {
  const [channelImageError, setChannelImageError] = useState(false);
  const [videoImageError, setVideoImageError] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);



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
        setIsLiked(
          likedVideos.some(
            (likedVideo) =>
              (likedVideo.id?.videoId || likedVideo.id) === videoIdToCheck
          )
        );
      } else {
        setIsLiked(false);
      }
    };

    const checkIfWatchLater = async () => {
      if (user?.uid && video?.id) {
        const watchLaterVideos = await getWatchLaterVideos(user.uid);
        const videoIdToCheck = getVideoId();
        setIsWatchLater(
          watchLaterVideos.some(
            (watchLaterVideo) =>
              (watchLaterVideo.id?.videoId || watchLaterVideo.id) ===
              videoIdToCheck
          )
        );
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
      const alreadyLiked = likedVideos.some(
        (likedVideo) =>
          (likedVideo.id?.videoId || likedVideo.id) === videoIdToSave
      );

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
      console.log("Removed from liked videos:", videoIdToRemove);
      if (onVideoRemoved) {
        onVideoRemoved(videoIdToRemove);
      }
    } catch (error) {
      console.error("Failed to remove from liked videos", error);
    }

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
      console.log("removed from watch later:", videoId);
      if (onVideoRemoved) {
        onVideoRemoved(videoId);
      }
    } catch (error) {
      console.log("Failed to remove from watch later", error);
    }

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
      const alreadyInWatchLater = watchLaterVideos.some(
        (watchLaterVideo) =>
          (watchLaterVideo.id?.videoId || watchLaterVideo.id) === videoIdToSave
      );

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

  };


  const channelTitle =
    channelDetails?.snippet?.title || video?.snippet?.channelTitle;

  return (
    <>
      <div className="group bg-[#0f0f0f]  rounded-xl overflow-hidden cursor-pointer">
        <div
          className="relative aspect-video"
          onClick={() => setIsVideoOpen(true)}
        >
          {!videoImageError ? (
            <div className="relative w-full h-full ">
              <img
                src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
                alt={video?.snippet?.title}
                className="w-full h-full object-cover"
                onError={() => setVideoImageError(true)}
              />
              <div className="absolute bottom-2 right-2 bg-black/80 px-1 rounded text-xs text-white">
                69:69
                {/* add some time */}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-500">No thumbnail available</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="flex gap-3">
            {!channelImageError && channelDetails?.snippet?.thumbnails && (
              <img
                src={getChannelThumbnailUrl(
                  channelDetails?.snippet?.thumbnails
                )}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={() => setChannelImageError(true)}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium line-clamp-2 mb-1 ">
                {video?.snippet?.title}
              </p>

              <div className="flex flex-col text-[13px] text-gray-400">
                <span>{channelTitle}</span>
                <div className="flex items-center gap-1 justify-between">
                  <span>{formatRelativeTime(video?.snippet?.publishedAt)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isWatchLater
                          ? handleRemoveWatchLater(e)
                          : handleWatchLater(e);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      <IconBookmark
                        size={18}
                        className={`${
                          isWatchLater ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isLiked
                          ? handleRemoveLikedVideo(e)
                          : handleLikeVideo(e);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      <IconThumbUp
                        size={18}
                        className={`${
                          isLiked ? "text-red-500" : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>
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
