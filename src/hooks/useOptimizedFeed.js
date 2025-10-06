import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchFeedVideos,
  checkForNewVideos,
  markNewVideosSeen,
  selectFeedVideos,
  selectFeedChannels,
  selectFeedLoading,
  selectFeedError,
  selectNewVideoCount,
  selectChannelDetails,
  cancelLoading
} from '../store/videoCacheSlice';
import { loadFeedData } from '../utils/constant';

/**
 * High-performance hook for feed management with Redux integration
 * Handles caching, auto-refresh, and optimized re-renders
 */
export const useOptimizedFeed = (feedName) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const abortControllerRef = useRef(null);
  
  // Redux selectors (memoized)
  const videos = useSelector(state => selectFeedVideos(state, feedName));
  const channels = useSelector(state => selectFeedChannels(state, feedName));
  const isLoading = useSelector(state => selectFeedLoading(state, feedName));
  const error = useSelector(state => selectFeedError(state, feedName));
  const newVideoCount = useSelector(state => selectNewVideoCount(state, feedName));
  
  // Local state
  const [feedChannels, setFeedChannels] = useState({});
  const [currentFeed, setCurrentFeed] = useState(null);
  const [hasChannels, setHasChannels] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(0);
  
  // Memoized channel details map
  const channelDetailsMap = useSelector(state => {
    const details = {};
    Object.keys(feedChannels).forEach(channelId => {
      const channelDetail = selectChannelDetails(state, channelId);
      if (channelDetail) {
        details[channelId] = channelDetail;
      }
    });
    return details;
  });
  
  // Memoized filtered videos
  const filteredVideos = useMemo(() => {
    if (!selectedChannel || !videos?.length) return videos || [];
    return videos.filter(video => video.snippet?.channelId === selectedChannel);
  }, [selectedChannel, videos]);
  
  // Load feed configuration
  const loadFeedConfig = useCallback(async () => {
    if (!user || !feedName) return;
    
    try {
      await loadFeedData(
        user,
        feedName,
        setCurrentFeed,
        setFeedChannels,
        setHasChannels,
        setInitialLoad
      );
    } catch (error) {
      console.error('Error loading feed config:', error);
      setInitialLoad(false);
    }
  }, [user, feedName]);
  
  // Fetch videos with abort signal
  const fetchVideos = useCallback(async (forceRefresh = false) => {
    if (!hasChannels || !Object.keys(feedChannels).length) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    const channelIds = Object.keys(feedChannels);
    
    try {
      await dispatch(fetchFeedVideos({
        channelIds,
        feedName,
        forceRefresh,
        signal: abortControllerRef.current.signal
      })).unwrap();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching videos:', error);
      }
    } finally {
      setInitialLoad(false);
    }
  }, [dispatch, feedName, feedChannels, hasChannels]);
  
  // Throttled refresh function
  const refreshFeed = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefresh < 30000) return; // 30 second throttle
    
    setLastRefresh(now);
    await fetchVideos(true);
  }, [fetchVideos, lastRefresh]);
  
  // Auto-refresh mechanism with cleanup
  useEffect(() => {
    if (!hasChannels || !Object.keys(feedChannels).length) return;
    
    const checkInterval = setInterval(async () => {
      const channelIds = Object.keys(feedChannels);
      
      try {
        await dispatch(checkForNewVideos({ channelIds, feedName }));
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(checkInterval);
  }, [dispatch, feedName, feedChannels, hasChannels]);
  
  // Load feed config on mount
  useEffect(() => {
    loadFeedConfig();
  }, [loadFeedConfig]);
  
  // Fetch videos when channels change
  useEffect(() => {
    if (hasChannels && Object.keys(feedChannels).length > 0) {
      fetchVideos();
    } else {
      setInitialLoad(false);
    }
  }, [fetchVideos, feedChannels, hasChannels]);
  
  // Mark new videos as seen
  useEffect(() => {
    if (newVideoCount > 0) {
      const timer = setTimeout(() => {
        dispatch(markNewVideosSeen(feedName));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [dispatch, feedName, newVideoCount]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cancel loading state
      dispatch(cancelLoading(feedName));
    };
  }, [dispatch, feedName]);
  
  // Channel selection handler
  const handleChannelSelect = useCallback((channelId) => {
    setSelectedChannel(prev => prev === channelId ? null : channelId);
  }, []);
  
  // Feed reload handler
  const reloadFeed = useCallback(async () => {
    setFeedChannels({});
    setCurrentFeed(null);
    setHasChannels(false);
    setInitialLoad(true);
    setSelectedChannel(null);
    
    // Small delay to ensure state is reset
    setTimeout(() => {
      loadFeedConfig();
    }, 100);
  }, [loadFeedConfig]);
  
  return {
    // Data
    videos: filteredVideos,
    allVideos: videos || [],
    channels,
    channelDetailsMap,
    feedChannels,
    currentFeed,
    
    // State
    isLoading,
    error,
    hasChannels,
    initialLoad,
    selectedChannel,
    newVideoCount,
    
    // Actions
    refreshFeed,
    reloadFeed,
    handleChannelSelect,
    setSelectedChannel,
    
    // Computed
    isEmpty: !hasChannels,
    hasVideos: filteredVideos.length > 0,
    totalVideos: videos?.length || 0,
    filteredCount: filteredVideos.length
  };
};

/**
 * Hook for managing UI state with performance optimizations
 */
export const useOptimizedUI = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(true);
  
  // Memoized grid columns calculation
  const gridColumns = useMemo(() => {
    if (isCollapsed && isLeftSidebarCollapsed) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
    } else if (!isCollapsed && !isLeftSidebarCollapsed) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    } else {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    }
  }, [isCollapsed, isLeftSidebarCollapsed]);
  
  // Left sidebar listener
  useEffect(() => {
    const handleLeftSidebar = (e) => {
      if (e.detail) {
        setIsLeftSidebarCollapsed(e.detail.isCollapsed);
      }
    };
    
    window.addEventListener('leftSidebarStateChange', handleLeftSidebar);
    return () => window.removeEventListener('leftSidebarStateChange', handleLeftSidebar);
  }, []);
  
  const openEditModal = useCallback(() => setIsEditModalOpen(true), []);
  const closeEditModal = useCallback(() => setIsEditModalOpen(false), []);
  const openSearchPopover = useCallback(() => setIsSearchPopoverOpen(true), []);
  const closeSearchPopover = useCallback(() => setIsSearchPopoverOpen(false), []);
  const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);
  
  return {
    // State
    isEditModalOpen,
    isSearchPopoverOpen,
    isCollapsed,
    isLeftSidebarCollapsed,
    gridColumns,
    
    // Actions
    openEditModal,
    closeEditModal,
    openSearchPopover,
    closeSearchPopover,
    toggleCollapse,
    setIsCollapsed
  };
};

/**
 * Hook for performance monitoring in development
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCount.current += 1;
      const now = Date.now();
      const timeSinceLastRender = now - lastRenderTime.current;
      
      if (renderCount.current % 10 === 0) {
        console.log(`${componentName} - Renders: ${renderCount.current}, Last interval: ${timeSinceLastRender}ms`);
      }
      
      if (timeSinceLastRender > 100) {
        console.warn(`${componentName} - Slow render detected: ${timeSinceLastRender}ms`);
      }
      
      lastRenderTime.current = now;
    }
  });
  
  return {
    renderCount: renderCount.current,
    reset: () => {
      renderCount.current = 0;
      lastRenderTime.current = Date.now();
    }
  };
};