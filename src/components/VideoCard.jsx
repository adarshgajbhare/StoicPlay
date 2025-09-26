/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  formatRelativeTime,
  getChannelThumbnailUrl,
  getVideoThumbnailUrl,
} from "../services/youtubeApi";
import {
  IconBookmark,
  IconThumbUp,
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

function VideoCard({ video, channelDetails, onVideoRemoved }) {
  const [channelImageError, setChannelImageError] = useState(false);
  const [videoImageError, setVideoImageError] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [videoDuration, setVideoDuration] = useState("");

  const getVideoId = () => {
    if (video.id?.videoId) return video.id.videoId;
    if (video.snippet?.resourceId?.videoId) return video.snippet.resourceId.videoId;
    if (typeof video.id === "string") return video.id;
    if (video.contentDetails?.videoId) return video.contentDetails.videoId;
    return null;
  };

  // Parse ISO 8601 duration to mm:ss or hh:mm:ss
  const parseDuration = (isoDuration) => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchDuration = async () => {
      const videoId = getVideoId();
      if (!videoId) return;

      try {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY; // store your API key in .env
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
        );
        const data = await res.json();
        const isoDuration = data.items?.[0]?.contentDetails?.duration;
        if (isoDuration) {
          setVideoDuration(parseDuration(isoDuration));
        }
      } catch (err) {
        console.error("Error fetching video duration:", err);
      }
    };

    fetchDuration();
  }, [video?.id]);

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
    e?.preventDefault();
    e?.stopPropagation();
    if (!user?.uid) return;

    try {
      const videoIdToSave = getVideoId();
      const likedVideos = await getLikedVideos(user.uid);
      const alreadyLiked = likedVideos.some(
        (likedVideo) =>
          (likedVideo.id?.videoId || likedVideo.id) === videoIdToSave
      );

      if (alreadyLiked) return;

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
    } catch (error) {
      console.error("Failed to save liked video:", error);
    }
  };

  const handleRemoveLikedVideo = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      const videoIdToRemove = getVideoId();
      await removeLikedVideo(user.uid, videoIdToRemove);
      setIsLiked(false);
      if (onVideoRemoved) onVideoRemoved(videoIdToRemove);
    } catch (error) {
      console.error("Failed to remove from liked videos", error);
    }
  };

  const handleRemoveWatchLater = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      const videoId = getVideoId();
      await removeWatchLaterVideo(user.uid, videoId);
      setIsWatchLater(false);
      if (onVideoRemoved) onVideoRemoved(videoId);
    } catch (error) {
      console.log("Failed to remove from watch later", error);
    }
  };

  const handleWatchLater = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user?.uid) return;

    try {
      const videoIdToSave = getVideoId();
      const watchLaterVideos = await getWatchLaterVideos(user.uid);
      const alreadyInWatchLater = watchLaterVideos.some(
        (watchLaterVideo) =>
          (watchLaterVideo.id?.videoId || watchLaterVideo.id) === videoIdToSave
      );

      if (alreadyInWatchLater) return;

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
    } catch (error) {
      console.error("Failed to save to watch later:", error);
    }
  };

  const channelTitle =
    channelDetails?.snippet?.title || video?.snippet?.channelTitle;

  return (
    <>
      <div className="group bg-[#0f0f0f] rounded-xl overflow-hidden cursor-pointer">
        <div
          className="relative aspect-video"
          onClick={() => setIsVideoOpen(true)}
        >
          {!videoImageError ? (
            <div className="relative w-full h-full">
              <img
                src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
                alt={video?.snippet?.title}
                className="w-full h-full object-cover"
                onError={() => setVideoImageError(true)}
              />
              {videoDuration && (
                <div className="absolute bottom-2 right-2 bg-black/80 px-1 rounded text-xs text-white">
                  {videoDuration}
                </div>
              )}
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
                src={getChannelThumbnailUrl(channelDetails?.snippet?.thumbnails)}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={() => setChannelImageError(true)}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                {video?.snippet?.title}
              </p>

              <div className="flex flex-col text-[13px] text-gray-400">
                <span>{channelTitle}</span>
                <div className="flex items-center gap-1 justify-between">
                  <span>{formatRelativeTime(video?.snippet?.publishedAt)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) =>
                        isWatchLater
                          ? handleRemoveWatchLater(e)
                          : handleWatchLater(e)
                      }
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
                      onClick={(e) =>
                        isLiked ? handleRemoveLikedVideo(e) : handleLikeVideo(e)
                      }
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
