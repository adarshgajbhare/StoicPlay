import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getVideoDuration, 
  getVideoDetails, 
  getChannelDetails,
  preloadVideoData,
  preloadChannelData,
  parseDuration
} from '../services/optimizedYoutubeApi';

/**
 * Custom hook for managing video data with intelligent preloading and caching
 */
export const useOptimizedVideoData = (videos = [], options = {}) => {
  const {
    preloadCount = 20,
    enablePreloading = true,
    onError = console.error
  } = options;

  const [videoDataMap, setVideoDataMap] = useState(new Map());
  const [channelDataMap, setChannelDataMap] = useState(new Map());
  const [durationMap, setDurationMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const loadingRef = useRef(false);
  const processedVideosRef = useRef(new Set());

  // Extract video IDs from videos array
  const getVideoId = useCallback((video) => {
    if (video.id?.videoId) return video.id.videoId;
    if (video.snippet?.resourceId?.videoId) return video.snippet.resourceId.videoId;
    if (typeof video.id === 'string') return video.id;
    if (video.contentDetails?.videoId) return video.contentDetails.videoId;
    return null;
  }, []);

  // Extract channel ID from video
  const getChannelId = useCallback((video) => {
    return video.snippet?.channelId || null;
  }, []);

  // Load video durations in batches
  const loadVideoDurations = useCallback(async (videoIds) => {
    if (!videoIds.length) return;

    try {
      const durationsPromises = videoIds.map(async (videoId) => {
        const duration = await getVideoDuration(videoId);
        return { videoId, duration: duration ? parseDuration(duration) : null };
      });

      const results = await Promise.all(durationsPromises);
      
      setDurationMap(prev => {
        const newMap = new Map(prev);
        results.forEach(({ videoId, duration }) => {
          if (duration) {
            newMap.set(videoId, duration);
          }
        });
        return newMap;
      });
    } catch (error) {
      onError('Error loading video durations:', error);
    }
  }, [onError]);

  // Load channel data in batches
  const loadChannelData = useCallback(async (channelIds) => {
    if (!channelIds.length) return;

    try {
      const uniqueChannelIds = [...new Set(channelIds)];
      
      if (enablePreloading) {
        await preloadChannelData(uniqueChannelIds);
      }

      const channelPromises = uniqueChannelIds.map(async (channelId) => {
        const channelData = await getChannelDetails(channelId);
        return { channelId, data: channelData };
      });

      const results = await Promise.all(channelPromises);
      
      setChannelDataMap(prev => {
        const newMap = new Map(prev);
        results.forEach(({ channelId, data }) => {
          if (data) {
            newMap.set(channelId, data);
          }
        });
        return newMap;
      });
    } catch (error) {
      onError('Error loading channel data:', error);
    }
  }, [enablePreloading, onError]);

  // Load video details in batches
  const loadVideoDetails = useCallback(async (videoIds) => {
    if (!videoIds.length) return;

    try {
      if (enablePreloading) {
        await preloadVideoData(videoIds);
      }

      const videoPromises = videoIds.map(async (videoId) => {
        const videoData = await getVideoDetails(videoId);
        return { videoId, data: videoData };
      });

      const results = await Promise.all(videoPromises);
      
      setVideoDataMap(prev => {
        const newMap = new Map(prev);
        results.forEach(({ videoId, data }) => {
          if (data) {
            newMap.set(videoId, data);
          }
        });
        return newMap;
      });
    } catch (error) {
      onError('Error loading video details:', error);
    }
  }, [enablePreloading, onError]);

  // Process videos for the first time or when videos change
  useEffect(() => {
    if (!videos.length || loadingRef.current) return;

    const processVideos = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        // Get video and channel IDs
        const videoIds = [];
        const channelIds = [];

        videos.forEach(video => {
          const videoId = getVideoId(video);
          const channelId = getChannelId(video);
          
          if (videoId && !processedVideosRef.current.has(videoId)) {
            videoIds.push(videoId);
            processedVideosRef.current.add(videoId);
          }
          
          if (channelId && !channelDataMap.has(channelId)) {
            channelIds.push(channelId);
          }
        });

        // Process initial batch
        const initialVideoIds = videoIds.slice(0, preloadCount);
        const initialChannelIds = channelIds.slice(0, preloadCount);

        await Promise.all([
          loadVideoDurations(initialVideoIds),
          loadChannelData(initialChannelIds),
          loadVideoDetails(initialVideoIds)
        ]);

        // Process remaining videos in background
        if (videoIds.length > preloadCount) {
          setTimeout(() => {
            const remainingVideoIds = videoIds.slice(preloadCount);
            const remainingChannelIds = channelIds.slice(preloadCount);
            
            Promise.all([
              loadVideoDurations(remainingVideoIds),
              loadChannelData(remainingChannelIds),
              loadVideoDetails(remainingVideoIds)
            ]).catch(onError);
          }, 1000);
        }
      } catch (err) {
        setError(err);
        onError('Error processing videos:', err);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    processVideos();
  }, [videos, preloadCount, loadVideoDurations, loadChannelData, loadVideoDetails, getVideoId, getChannelId, channelDataMap, onError]);

  // Preload data for specific video indices (useful for virtualized lists)
  const preloadVideosByIndex = useCallback(async (startIndex, endIndex) => {
    if (!enablePreloading || startIndex < 0 || endIndex >= videos.length) return;
    
    const videoIds = [];
    const channelIds = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      const video = videos[i];
      if (!video) continue;
      
      const videoId = getVideoId(video);
      const channelId = getChannelId(video);
      
      if (videoId && !durationMap.has(videoId)) {
        videoIds.push(videoId);
      }
      
      if (channelId && !channelDataMap.has(channelId)) {
        channelIds.push(channelId);
      }
    }
    
    if (videoIds.length > 0 || channelIds.length > 0) {
      try {
        await Promise.all([
          loadVideoDurations(videoIds),
          loadChannelData(channelIds)
        ]);
      } catch (error) {
        onError('Error preloading video data:', error);
      }
    }
  }, [videos, enablePreloading, durationMap, channelDataMap, loadVideoDurations, loadChannelData, getVideoId, getChannelId, onError]);

  // Get enriched video data
  const getEnrichedVideo = useCallback((video) => {
    const videoId = getVideoId(video);
    const channelId = getChannelId(video);
    
    return {
      ...video,
      duration: videoId ? durationMap.get(videoId) : null,
      videoDetails: videoId ? videoDataMap.get(videoId) : null,
      channelDetails: channelId ? channelDataMap.get(channelId) : null
    };
  }, [durationMap, videoDataMap, channelDataMap, getVideoId, getChannelId]);

  // Clear all caches
  const clearCache = useCallback(() => {
    setVideoDataMap(new Map());
    setChannelDataMap(new Map());
    setDurationMap(new Map());
    processedVideosRef.current.clear();
  }, []);

  return {
    videoDataMap,
    channelDataMap,
    durationMap,
    loading,
    error,
    preloadVideosByIndex,
    getEnrichedVideo,
    clearCache
  };
};

export default useOptimizedVideoData;
