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
  IconPlayerPlay,
  IconClock,
  IconEye,
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
        rootMargin: '100px',
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
      watchLaterCache.delete(cacheKey);
      if (onVideoRemoved) onVideoRemoved(videoId);
    } catch (error) {
      console.log("Failed to remove from watch later", error);
    }
  }, [user?.uid, videoId, onVideoRemoved]);

  if (!video?.snippet) {
    return null;
  }

  // Render professional glass morphism placeholder while not visible
  if (!isVisible) {
    return (
      <div ref={cardRef} className="glass-card p-1 animate-fade-in">
        <div className="glass-shimmer aspect-video rounded-lg mb-3 sm:mb-4"></div>
        <div className="p-3 sm:p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full glass-shimmer flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 sm:h-4 glass-shimmer rounded w-full"></div>
              <div className="h-2 sm:h-3 glass-shimmer rounded w-3/4"></div>
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
        className="group glass-card liquid-interactive overflow-hidden animate-fade-in"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Professional Video Thumbnail Container */}
        <div
          className="relative aspect-video overflow-hidden rounded-lg cursor-pointer"
          onClick={() => setIsVideoOpen(true)}
        >
          {/* Subtle background enhancement */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Thumbnail Image */}
          {!videoImageError ? (
            <div className="relative w-full h-full">
              {!imageLoaded && (
                <div className="absolute inset-0 glass-loading rounded-lg flex items-center justify-center">
                  <IconEye className="w-6 h-6 sm:w-8 sm:h-8 text-glass-muted animate-pulse" />
                </div>
              )}
              <img
                src={getVideoThumbnailUrl(video?.snippet?.thumbnails)}
                alt={video?.snippet?.title}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setVideoImageError(true)}
                loading="lazy"
              />
              
              {/* Professional Play Button Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}>
                <div className="glass-elevated rounded-full p-3 sm:p-4 accent-glow">
                  <IconPlayerPlay className="w-6 h-6 sm:w-8 sm:h-8 text-glass" />
                </div>
              </div>
              
              {/* Professional Duration Badge */}
              {videoDuration && imageLoaded && (
                <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 glass-strong px-2 sm:px-3 py-1 rounded-md text-xs font-medium text-glass flex items-center gap-1">
                  <IconClock className="w-3 h-3" />
                  <span className="text-xs">{videoDuration}</span>
                </div>
              )}
              
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="w-full h-full glass-soft flex items-center justify-center">
              <div className="text-center">
                <IconEye className="w-8 h-8 sm:w-12 sm:h-12 text-glass-muted mx-auto mb-2" />
                <span className="text-glass-muted text-xs sm:text-sm">No thumbnail available</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Section with Professional Design */}
        <div className="p-3 sm:p-4">
          <div className="flex gap-3">
            {/* Channel Avatar */}
            {!channelImageError && channelDetails?.snippet?.thumbnails && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-br from-blue-500/20 to-slate-500/10">
                  <img
                    src={getChannelThumbnailUrl(channelDetails?.snippet?.thumbnails)}
                    className="w-full h-full rounded-full object-cover"
                    onError={() => setChannelImageError(true)}
                    loading="lazy"
                  />
                </div>
              </div>
            )}
            
            {/* Video Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-glass font-semibold text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 group-hover:text-white transition-colors duration-300">
                {video?.snippet?.title}
              </h3>

              <div className="flex flex-col gap-1 text-xs text-glass-secondary">
                <span className="font-medium text-glass-secondary text-xs truncate">{channelTitle}</span>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-glass-muted">
                    <IconClock className="w-3 h-3" />
                    {relativeTime}
                  </span>
                  
                  {/* Professional Action Buttons */}
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={(e) =>
                        isWatchLater
                          ? handleRemoveWatchLater(e)
                          : handleWatchLater(e)
                      }
                      className={`glass-button p-1.5 sm:p-2 rounded-md transition-all duration-300 ${
                        isWatchLater 
                          ? "accent-glow border-blue-500/30" 
                          : "hover:glass-strong"
                      }`}
                      title={isWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
                    >
                      <IconBookmark
                        size={12}
                        className={`transition-colors duration-300 ${
                          isWatchLater 
                            ? "text-accent-blue" 
                            : "text-glass-muted hover:text-glass"
                        }`}
                      />
                    </button>
                    
                    <button
                      onClick={(e) =>
                        isLiked ? handleRemoveLikedVideo(e) : handleLikeVideo(e)
                      }
                      className={`glass-button p-1.5 sm:p-2 rounded-md transition-all duration-300 ${
                        isLiked 
                          ? "accent-glow border-emerald-500/30" 
                          : "hover:glass-strong"
                      }`}
                      title={isLiked ? "Remove from Liked" : "Add to Liked"}
                    >
                      <IconThumbUp
                        size={12}
                        className={`transition-colors duration-300 ${
                          isLiked 
                            ? "text-accent-emerald" 
                            : "text-glass-muted hover:text-glass"
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

      {/* Professional Video Player Modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 frosted-overlay z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="glass-modal max-w-6xl w-full animate-slide-in-bottom">
            <VideoPlayer
              videoId={videoId}
              onClose={() => setIsVideoOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default memo(VideoCard);