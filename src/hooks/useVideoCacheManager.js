import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback, useMemo } from 'react';
import {
  fetchFeedVideos,
  checkForNewVideos,
  refreshChannelVideos,
  clearFeedCache,
  clearAllCache,
  markNewVideosSeen,
  updateVideoInCache,
  removeVideoFromCache
} from '../store/videoCacheSlice';

/**
 * Custom hook for managing video cache with Redux integration
 * Provides intelligent caching, automatic refresh, and optimized API usage
 */
export const useVideoCacheManager = (feedName, channelIds, options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    forceRefresh = false,
    enableBackgroundRefresh = true
  } = options;

  const dispatch = useDispatch();
  
  // Select video cache state
  const {
    feeds,
    channelDetails,
    loading,
    error,
    newVideoCount
  } = useSelector(state => state.videoCache);

  // Get current feed data
  const feedData = useMemo(() => {
    const feed = feeds[feedName];
    if (!feed) return null;
    
    return {
      videos: feed.videos || [],
      channels: feed.channels || {},
      lastFetched: feed.lastFetched,
      lastIncrementalCheck: feed.lastIncrementalCheck,
      hasCache: true
    };
  }, [feeds, feedName]);

  // Get loading and error states for this feed
  const isLoading = loading[feedName] || false;
  const feedError = error[feedName] || null;
  const newVideosCount = newVideoCount[feedName] || 0;

  // Check if cache is fresh
  const isCacheFresh = useMemo(() => {
    if (!feedData) return false;
    
    const now = Date.now();
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
    
    return feedData.lastFetched && (now - feedData.lastFetched) < CACHE_DURATION;
  }, [feedData]);

  // Fetch videos for the feed
  const fetchVideos = useCallback(async (forceRefreshOverride = false) => {
    if (!channelIds || channelIds.length === 0) return;
    
    return dispatch(fetchFeedVideos({
      channelIds,
      feedName,
      forceRefresh: forceRefreshOverride || forceRefresh
    }));
  }, [dispatch, channelIds, feedName, forceRefresh]);

  // Check for new videos (lightweight check)
  const checkNewVideos = useCallback(async () => {
    if (!channelIds || channelIds.length === 0) return;
    
    return dispatch(checkForNewVideos({
      channelIds,
      feedName
    }));
  }, [dispatch, channelIds, feedName]);

  // Refresh specific channel
  const refreshChannel = useCallback(async (channelId) => {
    return dispatch(refreshChannelVideos({
      channelId,
      feedName
    }));
  }, [dispatch, feedName]);

  // Clear cache for this feed
  const clearCache = useCallback(() => {
    dispatch(clearFeedCache(feedName));
  }, [dispatch, feedName]);

  // Clear all caches
  const clearAllCaches = useCallback(() => {
    dispatch(clearAllCache());
  }, [dispatch]);

  // Mark new videos as seen
  const markVideosSeen = useCallback(() => {
    dispatch(markNewVideosSeen(feedName));
  }, [dispatch, feedName]);

  // Update video in cache (for like/unlike, etc.)
  const updateVideo = useCallback((videoId, updates) => {
    dispatch(updateVideoInCache({
      feedName,
      videoId,
      updates
    }));
  }, [dispatch, feedName]);

  // Remove video from cache
  const removeVideo = useCallback((videoId) => {
    dispatch(removeVideoFromCache({
      feedName,
      videoId
    }));
  }, [dispatch, feedName]);

  // Get enriched video data with channel details
  const enrichedVideos = useMemo(() => {
    if (!feedData?.videos) return [];
    
    return feedData.videos.map(video => {
      const channelId = video.snippet?.channelId;
      const channelData = feedData.channels[channelId] || channelDetails[channelId]?.data;
      
      return {
        ...video,
        channelDetails: channelData
      };
    });
  }, [feedData, channelDetails]);

  // Auto-fetch videos on mount or when dependencies change
  useEffect(() => {
    if (!channelIds || channelIds.length === 0) return;
    
    // If we have fresh cache, don't fetch unless forced
    if (isCacheFresh && !forceRefresh) {
      // Still do a lightweight check for new videos
      if (enableBackgroundRefresh) {
        checkNewVideos();
      }
      return;
    }
    
    // Fetch videos if no cache or cache is stale
    fetchVideos();
  }, [channelIds, feedName, isCacheFresh, forceRefresh, fetchVideos, checkNewVideos, enableBackgroundRefresh]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !enableBackgroundRefresh || !channelIds?.length) return;
    
    const interval = setInterval(() => {
      // Only do lightweight check during auto-refresh
      checkNewVideos();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, enableBackgroundRefresh, refreshInterval, checkNewVideos, channelIds]);

  // Refresh videos when coming back from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enableBackgroundRefresh && channelIds?.length) {
        // Check for new videos when tab becomes visible
        checkNewVideos();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkNewVideos, enableBackgroundRefresh, channelIds]);

  // Get cache statistics
  const cacheStats = useMemo(() => {
    const totalFeeds = Object.keys(feeds).length;
    const totalVideos = Object.values(feeds).reduce(
      (sum, feed) => sum + (feed.videos?.length || 0), 0
    );
    const totalChannels = Object.keys(channelDetails).length;
    
    return {
      totalFeeds,
      totalVideos,
      totalChannels,
      currentFeedVideoCount: feedData?.videos?.length || 0,
      lastFetched: feedData?.lastFetched,
      lastIncrementalCheck: feedData?.lastIncrementalCheck,
      isCacheFresh
    };
  }, [feeds, channelDetails, feedData, isCacheFresh]);

  return {
    // Data
    videos: enrichedVideos,
    channels: feedData?.channels || {},
    hasCache: !!feedData,
    
    // State
    isLoading,
    error: feedError,
    newVideosCount,
    isCacheFresh,
    
    // Actions
    fetchVideos,
    checkNewVideos,
    refreshChannel,
    clearCache,
    clearAllCaches,
    markVideosSeen,
    updateVideo,
    removeVideo,
    
    // Statistics
    cacheStats
  };
};

/**
 * Hook for managing global video cache operations
 */
export const useGlobalVideoCache = () => {
  const dispatch = useDispatch();
  const { feeds, channelDetails, loading, error, newVideoCount } = useSelector(
    state => state.videoCache
  );

  const clearAllCaches = useCallback(() => {
    dispatch(clearAllCache());
  }, [dispatch]);

  const getTotalNewVideos = useCallback(() => {
    return Object.values(newVideoCount).reduce((sum, count) => sum + count, 0);
  }, [newVideoCount]);

  const getFeedCacheInfo = useCallback((feedName) => {
    const feed = feeds[feedName];
    if (!feed) return null;
    
    const now = Date.now();
    const age = feed.lastFetched ? now - feed.lastFetched : null;
    const incrementalAge = feed.lastIncrementalCheck ? now - feed.lastIncrementalCheck : null;
    
    return {
      videoCount: feed.videos?.length || 0,
      lastFetched: feed.lastFetched,
      lastIncrementalCheck: feed.lastIncrementalCheck,
      ageInMinutes: age ? Math.floor(age / 60000) : null,
      incrementalAgeInMinutes: incrementalAge ? Math.floor(incrementalAge / 60000) : null,
      isFresh: age ? age < 15 * 60 * 1000 : false, // 15 minutes
      newVideosCount: newVideoCount[feedName] || 0
    };
  }, [feeds, newVideoCount]);

  const cacheStats = useMemo(() => {
    const totalFeeds = Object.keys(feeds).length;
    const totalVideos = Object.values(feeds).reduce(
      (sum, feed) => sum + (feed.videos?.length || 0), 0
    );
    const totalChannels = Object.keys(channelDetails).length;
    const totalNewVideos = getTotalNewVideos();
    
    // Calculate cache size estimate
    const estimatedSizeKB = Math.round(
      JSON.stringify({ feeds, channelDetails }).length / 1024
    );
    
    return {
      totalFeeds,
      totalVideos,
      totalChannels,
      totalNewVideos,
      estimatedSizeKB,
      isLoading: Object.values(loading).some(Boolean),
      hasErrors: Object.values(error).some(Boolean)
    };
  }, [feeds, channelDetails, loading, error, getTotalNewVideos]);

  return {
    feeds,
    channelDetails,
    loading,
    error,
    newVideoCount,
    cacheStats,
    clearAllCaches,
    getTotalNewVideos,
    getFeedCacheInfo
  };
};

export default useVideoCacheManager;
