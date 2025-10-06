/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
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

// Cache for API responses
const durationCache = new Map();
const likedVideosCache = new Map();
const watchLaterCache = new Map();

function VideoCard({ video, channelDetails, onVideoRemoved }) {
  const [channelImageError, setChannelImageError] = useState(false);
  const [videoImageError, setVideoImageError] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [videoDuration, setVideoDuration] = useState("");
  const cardRef = useRef(null);
  const observerRef = useRef(null);

  // Memoized video ID getter
  const videoId = React.useMemo(() => {
    if (video.id?.videoId) return video.id.videoId;
    if (video.snippet?.resourceId?.videoId) return video.snippet.resourceId.videoId;
    if (typeof video.id === "string") return video.id;
    if (video.contentDetails?.videoId) return video.contentDetails.videoId;
    return null;
  }, [video]);

  // Memoized channel title
  const channelTitle = React.useMemo(() => {
    return channelDetails?.snippet?.title || video?.snippet?.channelTitle;
  }, [channelDetails?.snippet?.title, video?.snippet?.channelTitle]);

  // Memoized relative time
  const relativeTime = React.useMemo(() => {
    return formatRelativeTime(video?.snippet?.publishedAt);
  }, [video?.snippet?.publishedAt]);

  // Parse ISO 8601 duration to mm:ss or hh:mm:ss
  const parseDuration = useCallback((isoDuration) => {
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
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!cardRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '100px', // Load 100px before entering viewport
        threshold: 0.1
      }
    );

    observerRef.current.observe(cardRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Fetch video duration only when visible
  useEffect(() => {
    if (!isVisible || !videoId) return;

    const fetchDuration = async () => {
      // Check cache first
      if (durationCache.has(videoId)) {
        setVideoDuration(durationCache.get(videoId));
        return;
      }

      try {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
        );
        const data = await res.json();
        const isoDuration = data.items?.[0]?.contentDetails?.duration;
        if (isoDuration) {
          const duration = parseDuration(isoDuration);
          durationCache.set(videoId, duration);
          setVideoDuration(duration);
        }
      } catch (err) {
        console.error("Error fetching video duration:", err);
      }
    };

    fetchDuration();
  }, [isVisible, videoId, parseDuration]);

  // Check liked status with caching
  useEffect(() => {
    if (!user?.uid || !videoId || !isVisible) return;

    const checkIfLiked = async () => {
      const cacheKey = `${user.uid}-liked`;
      let likedVideos;
      
      if (likedVideosCache.has(cacheKey)) {
        likedVideos = likedVideosCache.get(cacheKey);
      } else {
        likedVideos = await getLikedVideos(user.uid);
        likedVideosCache.set(cacheKey, likedVideos);
        // Cache for 1 minute
        setTimeout(() => likedVideosCache.delete(cacheKey), 60000);
      }
      
      setIsLiked(
        likedVideos.some(
          (likedVideo) => (likedVideo.id?.videoId || likedVideo.id) === videoId
        )
      );
    };

    checkIfLiked();
  }, [user?.uid, videoId, isVisible]);

  // Check watch later status with caching
  useEffect(() => {
    if (!user?.uid || !videoId || !isVisible) return;

    const checkIfWatchLater = async () => {
      const cacheKey = `${user.uid}-watchlater`;
      let watchLaterVideos;
      
      if (watchLaterCache.has(cacheKey)) {
        watchLaterVideos = watchLaterCache.get(cacheKey);
      } else {
        watchLaterVideos = await getWatchLaterVideos(user.uid);
        watchLaterCache.set(cacheKey, watchLaterVideos);
        // Cache for 1 minute
        setTimeout(() => watchLaterCache.delete(cacheKey), 60000);
      }
      
      setIsWatchLater(
        watchLaterVideos.some(
          (watchLaterVideo) =>
            (watchLaterVideo.id?.videoId || watchLaterVideo.id) === videoId
        )
      );
    };

    checkIfWatchLater();
  }, [user?.uid, videoId, isVisible]);

  // Optimized handlers with cache invalidation
  const handleLikeVideo = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user?.uid || !videoId) return;

    try {
      const cacheKey = `${user.uid}-liked`;
      const likedVideos = await getLikedVideos(user.uid);
      const alreadyLiked = likedVideos.some(
        (likedVideo) => (likedVideo.id?.videoId || likedVideo.id) === videoId
      );

      if (alreadyLiked) return;

      const videoToSave = {
        ...video,
        channelDetails,
        id: videoId,
        snippet: {
          ...video.snippet,
          thumbnails: video.snippet.thumbnails || {},
          channelTitle: channelTitle,
        },
      };

      await saveLikedVideo(user.uid, videoToSave);
      setIsLiked(true);
      // Invalidate cache
      likedVideosCache.delete(cacheKey);
    } catch (error) {
      console.error("Failed to save liked video:", error);
    }
  }, [user?.uid, videoId, video, channelDetails, channelTitle]);

  const handleRemoveLikedVideo = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user?.uid || !videoId) return;

    try {
      const cacheKey = `${user.uid}-liked`;
      await removeLikedVideo(user.uid, videoId);
      setIsLiked(false);
      // Invalidate cache
      likedVideosCache.delete(cacheKey);
      if (onVideoRemoved) onVideoRemoved(videoId);
    } catch (error) {
      console.error("Failed to remove from liked videos", error);
    }
  }, [user?.uid, videoId, onVideoRemoved]);

  const handleWatchLater = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user?.uid || !videoId) return;

    try {
      const cacheKey = `${user.uid}-watchlater`;
      const watchLaterVideos = await getWatchLaterVideos(user.uid);
      const alreadyInWatchLater = watchLaterVideos.some(
        (watchLaterVideo) =>
          (watchLaterVideo.id?.videoId || watchLaterVideo.id) === videoId
      );

      if (alreadyInWatchLater) return;

      const videoToSave = {
        ...video,
        channelDetails,
        id: videoId,
        snippet: {
          ...video.snippet,
          thumbnails: video.snippet.thumbnails || {},
          channelTitle: channelTitle,
        },
      };

      await saveWatchLater(user.uid, videoToSave);
      setIsWatchLater(true);
      // Invalidate cache
      watchLaterCache.delete(cacheKey);
    } catch (error) {
      console.error("Failed to save to watch later:", error);
    }
  }, [user?.uid, videoId, video, channelDetails, channelTitle]);

  const handleRemoveWatchLater = useCallback(async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user?.uid || !videoId) return;

    try {
      const cacheKey = `${user.uid}-watchlater`;
      await removeWatchLaterVideo(user.uid, videoId);
      setIsWatchLater(false);
      // Invalidate cache
      watchLaterCache.delete(cacheKey);
      if (onVideoRemoved) onVideoRemoved(videoId);
    } catch (error) {
      console.log("Failed to remove from watch later", error);
    }
  }, [user?.uid, videoId, onVideoRemoved]);

  if (!video?.snippet) {
    return null;
  }

  // Render placeholder while not visible
  if (!isVisible) {
    return (
      <div 
        ref={cardRef} 
        className="group bg-[#0f0f0f] rounded-xl overflow-hidden cursor-pointer animate-pulse"
      >
        <div className="aspect-video bg-gray-800"></div>
        <div className="p-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={cardRef} className="group bg-[#0f0f0f] rounded-xl overflow-hidden cursor-pointer">
        <div
          className="relative aspect-video"
          onClick={() => setIsVideoOpen(true)}
        >
          {!videoImageError ? (
            <div className="relative w-full h-full">
              {/* Low quality placeholder */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading...</span>
                </div>
              )}
              <img
                src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
                alt={video?.snippet?.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setVideoImageError(true)}
                loading="lazy"
              />
              {videoDuration && imageLoaded && (
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
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                {video?.snippet?.title}
              </p>

              <div className="flex flex-col text-[13px] text-gray-400">
                <span>{channelTitle}</span>
                <div className="flex items-center gap-1 justify-between">
                  <span>{relativeTime}</span>
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
          videoId={videoId}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </>
  );
}

export default memo(VideoCard);