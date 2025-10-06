/* eslint-disable react/prop-types */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useVideoCacheManager } from '../hooks/useVideoCacheManager';
import VirtualizedVideoGrid from './VirtualizedVideoGrid';
import VideoCard from './VideoCard';
import { 
  IconRefresh, 
  IconBell, 
  IconCheck, 
  IconClearAll, 
  IconSettings,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';

/**
 * Optimized Video Feed Component with Redux caching
 * Features:
 * - Intelligent caching with automatic refresh
 * - New video notifications
 * - Virtualized rendering for large datasets
 * - Background sync when tab becomes visible
 * - Cache statistics and management
 */
function OptimizedVideoFeed({ 
  feedName, 
  channelIds = [], 
  className = '',
  renderMode = 'virtualized', // 'virtualized' | 'grid'
  showControls = true,
  autoRefresh = true,
  onVideoRemoved
}) {
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize video cache manager
  const {
    videos,
    hasCache,
    isLoading,
    error,
    newVideosCount,
    isCacheFresh,
    fetchVideos,
    checkNewVideos,
    markVideosSeen,
    clearCache,
    cacheStats
  } = useVideoCacheManager(feedName, channelIds, {
    autoRefresh,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableBackgroundRefresh: true
  });

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchVideos(true); // Force refresh
    } catch (err) {
      console.error('Error refreshing videos:', err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchVideos]);

  // Handle new videos notification click
  const handleNewVideosClick = useCallback(() => {
    markVideosSeen();
    // Optionally scroll to top to show new videos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [markVideosSeen]);

  // Handle cache clear
  const handleClearCache = useCallback(() => {
    clearCache();
    // Refetch after clearing cache
    setTimeout(() => {
      fetchVideos(true);
    }, 100);
  }, [clearCache, fetchVideos]);

  // Create channel details map for compatibility
  const channelDetailsMap = useMemo(() => {
    const map = new Map();
    videos.forEach(video => {
      if (video.channelDetails && video.snippet?.channelId) {
        map.set(video.snippet.channelId, video.channelDetails);
      }
    });
    return map;
  }, [videos]);

  // Handle video removal (for liked/watch later)
  const handleVideoRemoved = useCallback((videoId) => {
    if (onVideoRemoved) {
      onVideoRemoved(videoId);
    }
  }, [onVideoRemoved]);

  // Show loading state for initial load
  if (isLoading && !hasCache) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400 text-center">
          Loading videos for {feedName}...
        </p>
        <p className="text-gray-500 text-sm text-center mt-2">
          This may take a moment for the first load
        </p>
      </div>
    );
  }

  // Show error state
  if (error && !hasCache) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-64 ${className}`}>
        <div className="text-red-500 text-center mb-4">
          <p className="text-lg font-medium">Error loading videos</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={refreshing}
        >
          {refreshing ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  // Show empty state
  if (!isLoading && videos.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-64 ${className}`}>
        <div className="text-gray-400 text-center">
          <p className="text-lg font-medium mb-2">No videos found</p>
          <p className="text-sm mb-4">
            {channelIds.length === 0 
              ? 'No channels selected for this feed'
              : 'No recent videos from selected channels'
            }
          </p>
          {channelIds.length > 0 && (
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={refreshing}
            >
              {refreshing ? 'Checking...' : 'Check Again'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Controls Header */}
      {showControls && (
        <div className="flex items-center justify-between mb-4 p-4 bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-4">
            {/* Cache Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isCacheFresh ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm text-gray-400">
                {isCacheFresh ? 'Cache Fresh' : 'Cache Stale'}
              </span>
            </div>

            {/* Video Count */}
            <span className="text-sm text-gray-400">
              {videos.length} video{videos.length !== 1 ? 's' : ''}
            </span>

            {/* New Videos Notification */}
            {newVideosCount > 0 && (
              <button
                onClick={handleNewVideosClick}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full hover:bg-blue-600/30 transition-colors"
              >
                <IconBell size={16} />
                <span className="text-sm">{newVideosCount} new</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh videos"
            >
              <IconRefresh size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>

            {/* Clear Cache Button */}
            <button
              onClick={handleClearCache}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Clear cache"
            >
              <IconClearAll size={18} />
            </button>

            {/* Cache Info Toggle */}
            <button
              onClick={() => setShowCacheInfo(!showCacheInfo)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Cache information"
            >
              <IconSettings size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Cache Information Panel */}
      {showCacheInfo && (
        <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Cache Statistics</h3>
            <button
              onClick={() => setShowCacheInfo(false)}
              className="text-gray-400 hover:text-white"
            >
              <IconChevronUp size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Videos Cached</p>
              <p className="text-white font-medium">{cacheStats.currentFeedVideoCount}</p>
            </div>
            <div>
              <p className="text-gray-400">Last Fetched</p>
              <p className="text-white font-medium">
                {cacheStats.lastFetched 
                  ? new Date(cacheStats.lastFetched).toLocaleTimeString()
                  : 'Never'
                }
              </p>
            </div>
            <div>
              <p className="text-gray-400">Cache Age</p>
              <p className="text-white font-medium">
                {cacheStats.lastFetched 
                  ? `${Math.floor((Date.now() - cacheStats.lastFetched) / 60000)}m`
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className={`font-medium ${
                isCacheFresh ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {isCacheFresh ? 'Fresh' : 'Stale'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator for Background Refresh */}
      {isLoading && hasCache && (
        <div className="mb-4 p-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm text-center">
          Checking for new videos...
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1">
        {renderMode === 'virtualized' ? (
          <VirtualizedVideoGrid
            videos={videos}
            channelDetailsMap={channelDetailsMap}
            onVideoRemoved={handleVideoRemoved}
            className="h-screen"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video, index) => {
              const videoId = video.id?.videoId || video.snippet?.resourceId?.videoId || video.id || index;
              return (
                <VideoCard
                  key={videoId}
                  video={video}
                  channelDetails={video.channelDetails}
                  onVideoRemoved={handleVideoRemoved}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(OptimizedVideoFeed);
