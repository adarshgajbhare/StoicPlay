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
  IconBookmarkFilled,
  IconHeartFilled,
  IconPlay,
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
  const [isHovered, setIsHovered] = useState(false);
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
        className="liquid-glass-subtle rounded-ios-lg overflow-hidden cursor-pointer animate-liquid-pulse"
      >
        <div className="aspect-video bg-glass-dark-soft shimmer"></div>
        <div className="p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-glass-dark flex-shrink-0 shimmer"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-glass-dark rounded-ios shimmer"></div>
              <div className="h-3 bg-glass-dark-soft rounded-ios w-3/4 shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={cardRef} 
        className="group liquid-glass-interactive rounded-ios-lg overflow-hidden cursor-pointer transition-all duration-medium hover:shadow-glass-medium animate-fade-in will-change-transform gpu-accelerated"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail Container */}
        <div
          className="relative aspect-video overflow-hidden"
          onClick={() => setIsVideoOpen(true)}
        >
          {!videoImageError ? (
            <div className="relative w-full h-full">
              {/* Loading Placeholder */}
              {!imageLoaded && (
                <div className="absolute inset-0 liquid-glass flex items-center justify-center">
                  <div className="text-liquid-tertiary text-sm animate-liquid-pulse">
                    Loading...
                  </div>
                </div>
              )}
              
              {/* Video Thumbnail */}
              <img
                src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
                alt={video?.snippet?.title}
                className={`w-full h-full object-cover transition-all duration-medium group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setVideoImageError(true)}
                loading="lazy"
              />
              
              {/* Play Button Overlay */}
              {isHovered && imageLoaded && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                  <div className="liquid-glass p-4 rounded-full border border-neon-blue/30 shadow-neon-blue animate-liquid-glow">
                    <IconPlay size={24} className="text-liquid-primary ml-1" fill="currentColor" />
                  </div>
                </div>
              )}
              
              {/* Duration Badge */}
              {videoDuration && imageLoaded && (
                <div className="absolute bottom-2 right-2 liquid-glass-subtle px-2 py-1 rounded-ios text-xs text-liquid-primary font-medium">
                  {videoDuration}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full liquid-glass flex items-center justify-center">
              <span className="text-liquid-tertiary text-sm">No thumbnail available</span>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Channel Avatar */}
            {!channelImageError && channelDetails?.snippet?.thumbnails && (
              <div className="flex-shrink-0 relative group">
                <img
                  src={getChannelThumbnailUrl(channelDetails?.snippet?.thumbnails)}
                  className="w-8 h-8 rounded-full object-cover border border-glass-border transition-all duration-fast group-hover:border-neon-blue group-hover:scale-110"
                  onError={() => setChannelImageError(true)}
                  loading="lazy"
                />
                <div className="absolute inset-0 rounded-full bg-neon-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-fast"></div>
              </div>
            )}
            
            {/* Video Info */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-liquid-primary text-sm font-semibold line-clamp-2 mb-2 group-hover:text-neon-blue transition-colors duration-fast">
                {video?.snippet?.title}
              </h3>

              {/* Metadata */}
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-liquid-secondary hover:text-liquid-primary transition-colors duration-fast truncate">
                  {channelTitle}
                </span>
                
                <div className="flex items-center justify-between">
                  <span className="text-liquid-tertiary">
                    {relativeTime}
                  </span>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-medium">
                    {/* Watch Later Button */}
                    <button
                      onClick={(e) =>
                        isWatchLater
                          ? handleRemoveWatchLater(e)
                          : handleWatchLater(e)
                      }
                      className="liquid-glass-interactive p-1.5 rounded-ios hover:scale-110 transition-all duration-fast"
                      title={isWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
                    >
                      {isWatchLater ? (
                        <IconBookmarkFilled 
                          size={16} 
                          className="text-neon-blue drop-shadow-sm"
                        />
                      ) : (
                        <IconBookmark 
                          size={16} 
                          className="text-liquid-secondary hover:text-neon-blue transition-colors duration-fast"
                        />
                      )}
                    </button>
                    
                    {/* Like Button */}
                    <button
                      onClick={(e) =>
                        isLiked ? handleRemoveLikedVideo(e) : handleLikeVideo(e)
                      }
                      className="liquid-glass-interactive p-1.5 rounded-ios hover:scale-110 transition-all duration-fast"
                      title={isLiked ? "Remove from Liked" : "Add to Liked"}
                    >
                      {isLiked ? (
                        <IconHeartFilled 
                          size={16} 
                          className="text-neon-pink drop-shadow-sm"
                        />
                      ) : (
                        <IconThumbUp 
                          size={16} 
                          className="text-liquid-secondary hover:text-neon-pink transition-colors duration-fast"
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
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