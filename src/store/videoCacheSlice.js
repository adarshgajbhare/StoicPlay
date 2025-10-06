import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  fetchChannelVideos,
  fetchChannelDetails,
  fetchChannelUploadsPlaylistId,
  fetchVideosForChannel,
} from '../services/youtubeApi';
import { preloadVideoData, preloadChannelData } from '../services/optimizedYoutubeApi';

// Enhanced async thunk with intelligent caching and batching
export const fetchFeedVideos = createAsyncThunk(
  'videoCache/fetchFeedVideos',
  async ({ channelIds, feedName, forceRefresh = false }, { getState, dispatch, signal }) => {
    const state = getState();
    const feedCache = state.videoCache.feeds[feedName];
    const now = Date.now();
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
    const INCREMENTAL_CHECK_DURATION = 5 * 60 * 1000; // 5 minutes

    // Abort if signal is aborted
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    // Intelligent cache validation
    if (!forceRefresh && feedCache) {
      const isRecentCache = (now - feedCache.lastFetched) < CACHE_DURATION;
      const shouldIncrementalCheck = (now - feedCache.lastIncrementalCheck) < INCREMENTAL_CHECK_DURATION;
      
      if (isRecentCache && shouldIncrementalCheck) {
        // Return cached data immediately for ultra-fast loading
        return {
          feedName,
          videos: feedCache.videos,
          channels: feedCache.channels,
          fromCache: true,
          lastFetched: feedCache.lastFetched,
          lastIncrementalCheck: feedCache.lastIncrementalCheck,
          cacheHit: true
        };
      }
    }

    try {
      // Batch fetch channel details with Promise.allSettled for resilience
      const channelDetailsPromises = channelIds.map(async (channelId) => {
        // Check cache first
        const cachedChannel = state.videoCache.channelDetails[channelId];
        if (cachedChannel && (now - cachedChannel.fetchedAt) < 30 * 60 * 1000) {
          return { channelId, data: cachedChannel.data, fromCache: true };
        }
        
        // Fetch with abort signal
        if (signal?.aborted) throw new Error('Aborted');
        
        const details = await fetchChannelDetails(channelId);
        return { channelId, data: details, fromCache: false };
      });

      const channelResults = await Promise.allSettled(channelDetailsPromises);
      const channelDetails = new Map();
      
      // Process results and cache successful ones
      channelResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { channelId, data, fromCache } = result.value;
          if (data) {
            channelDetails.set(channelId, data);
            if (!fromCache) {
              dispatch(cacheChannelDetails({ channelId, details: data, fetchedAt: now }));
            }
          }
        } else {
          console.warn('Failed to fetch channel details:', result.reason);
        }
      });

      // Batch fetch videos with concurrency control
      const CONCURRENT_LIMIT = 3; // Limit concurrent requests
      const videoPromises = [];
      
      for (let i = 0; i < channelIds.length; i += CONCURRENT_LIMIT) {
        const batch = channelIds.slice(i, i + CONCURRENT_LIMIT);
        
        const batchPromises = batch.map(async (channelId) => {
          if (signal?.aborted) throw new Error('Aborted');
          
          try {
            const videos = await fetchChannelVideos(channelId);
            return { channelId, videos, success: true };
          } catch (error) {
            console.error(`Error fetching videos for channel ${channelId}:`, error);
            
            // Fallback to cache if available
            const cachedVideos = feedCache?.videos?.filter(
              video => video.snippet?.channelId === channelId
            ) || [];
            
            return { channelId, videos: cachedVideos, success: false, error };
          }
        });
        
        videoPromises.push(...batchPromises);
        
        // Wait for batch completion before starting next batch
        if (i + CONCURRENT_LIMIT < channelIds.length) {
          await Promise.allSettled(batchPromises);
        }
      }
      
      const videoResults = await Promise.allSettled(videoPromises);
      
      // Process video results
      let allVideos = [];
      let hasNewVideos = false;
      const errors = [];
      
      videoResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { channelId, videos, success, error } = result.value;
          
          if (success && videos.length > 0) {
            // Check for new videos if we have cache
            if (feedCache && !forceRefresh) {
              const cachedChannelVideos = feedCache.videos.filter(
                video => video.snippet?.channelId === channelId
              );
              
              if (cachedChannelVideos.length > 0) {
                const latestNewVideo = new Date(videos[0]?.snippet?.publishedAt);
                const latestCachedVideo = new Date(cachedChannelVideos[0]?.snippet?.publishedAt);
                
                if (latestNewVideo > latestCachedVideo) {
                  hasNewVideos = true;
                }
              }
            }
            
            allVideos = allVideos.concat(videos);
          } else if (error) {
            errors.push({ channelId, error });
          }
        }
      });

      // Sort videos by publish date (newest first) with error handling
      allVideos.sort((a, b) => {
        const dateA = new Date(a.snippet?.publishedAt || 0);
        const dateB = new Date(b.snippet?.publishedAt || 0);
        return dateB - dateA;
      });

      // Preload video data for better UX (non-blocking)
      const videoIds = allVideos.slice(0, 20).map(video => {
        return video.id?.videoId || video.snippet?.resourceId?.videoId || video.id;
      }).filter(Boolean);

      // Background preloading (don't await)
      if (videoIds.length > 0) {
        Promise.allSettled([
          preloadVideoData(videoIds),
          preloadChannelData(channelIds)
        ]).catch(console.warn);
      }

      return {
        feedName,
        videos: allVideos,
        channels: Object.fromEntries(channelDetails),
        fromCache: false,
        hasNewVideos,
        lastFetched: now,
        lastIncrementalCheck: now,
        errors: errors.length > 0 ? errors : undefined,
        cacheHit: false
      };
    } catch (error) {
      if (error.message === 'Aborted') {
        throw error;
      }
      
      console.error('Error fetching feed videos:', error);
      
      // Fallback to cache if available
      if (feedCache) {
        return {
          feedName,
          videos: feedCache.videos,
          channels: feedCache.channels,
          fromCache: true,
          error: error.message,
          lastFetched: feedCache.lastFetched,
          lastIncrementalCheck: now,
          fallbackUsed: true
        };
      }
      
      throw error;
    }
  },
  {
    // Add condition to prevent duplicate requests
    condition: ({ feedName }, { getState }) => {
      const { videoCache } = getState();
      // Don't fetch if already loading
      return !videoCache.loading[feedName];
    }
  }
);

// Optimized incremental update with minimal API calls
export const checkForNewVideos = createAsyncThunk(
  'videoCache/checkForNewVideos',
  async ({ channelIds, feedName }, { getState, dispatch, signal }) => {
    const state = getState();
    const feedCache = state.videoCache.feeds[feedName];
    
    if (!feedCache) {
      // No cache, trigger full fetch
      return dispatch(fetchFeedVideos({ channelIds, feedName }));
    }

    const now = Date.now();
    let hasNewVideos = false;
    const newVideos = [];
    const channelChecks = [];

    try {
      // Batch check for new videos (1 per channel)
      for (const channelId of channelIds) {
        if (signal?.aborted) throw new Error('Aborted');
        
        channelChecks.push(
          (async () => {
            try {
              const uploadsPlaylistId = await fetchChannelUploadsPlaylistId(channelId);
              const latestVideos = await fetchVideosForChannel(uploadsPlaylistId, 1);
              
              if (latestVideos.length > 0) {
                const latestVideo = latestVideos[0];
                const latestVideoDate = new Date(latestVideo.snippet?.publishedAt);
                
                // Check against cached latest
                const cachedChannelVideos = feedCache.videos.filter(
                  video => video.snippet?.channelId === channelId
                );
                
                if (cachedChannelVideos.length > 0) {
                  const cachedLatestDate = new Date(cachedChannelVideos[0]?.snippet?.publishedAt);
                  
                  if (latestVideoDate > cachedLatestDate) {
                    hasNewVideos = true;
                    return latestVideo;
                  }
                } else {
                  // No cached videos for this channel
                  hasNewVideos = true;
                  return latestVideo;
                }
              }
              return null;
            } catch (error) {
              console.warn(`Error checking for new videos in channel ${channelId}:`, error);
              return null;
            }
          })()
        );
      }

      const results = await Promise.allSettled(channelChecks);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          newVideos.push(result.value);
        }
      });

      return {
        feedName,
        hasNewVideos,
        newVideos,
        lastIncrementalCheck: now,
        checkedChannels: channelIds.length
      };
    } catch (error) {
      if (error.message === 'Aborted') {
        throw error;
      }
      
      console.error('Error checking for new videos:', error);
      return {
        feedName,
        hasNewVideos: false,
        newVideos: [],
        error: error.message,
        lastIncrementalCheck: now
      };
    }
  }
);

// High-performance single channel refresh
export const refreshChannelVideos = createAsyncThunk(
  'videoCache/refreshChannelVideos',
  async ({ channelId, feedName }, { getState, dispatch, signal }) => {
    if (signal?.aborted) throw new Error('Aborted');
    
    try {
      const [videos, channelDetails] = await Promise.all([
        fetchChannelVideos(channelId),
        fetchChannelDetails(channelId)
      ]);
      
      return {
        channelId,
        feedName,
        videos,
        channelDetails,
        lastFetched: Date.now()
      };
    } catch (error) {
      console.error(`Error refreshing channel ${channelId}:`, error);
      throw error;
    }
  }
);

const videoCacheSlice = createSlice({
  name: 'videoCache',
  initialState: {
    feeds: {}, // Normalized feed data
    channelDetails: {}, // Normalized channel data
    loading: {}, // Loading states by feed
    error: {}, // Error states by feed
    newVideoCount: {}, // New video counts by feed
    searchResults: {}, // Search results cache
    searchLoading: {}, // Search loading states
    lastCleanup: null // Last cleanup timestamp
  },
  reducers: {
    // Cache channel details with deduplication
    cacheChannelDetails: (state, action) => {
      const { channelId, details, fetchedAt } = action.payload;
      
      // Only update if newer data
      const existing = state.channelDetails[channelId];
      if (!existing || fetchedAt > existing.fetchedAt) {
        state.channelDetails[channelId] = {
          data: details,
          fetchedAt
        };
      }
    },
    
    // Efficient cache clearing
    clearFeedCache: (state, action) => {
      const feedName = action.payload;
      delete state.feeds[feedName];
      delete state.loading[feedName];
      delete state.error[feedName];
      delete state.newVideoCount[feedName];
    },
    
    // Nuclear option - clear everything
    clearAllCache: (state) => {
      return {
        ...state,
        feeds: {},
        channelDetails: {},
        loading: {},
        error: {},
        newVideoCount: {},
        searchResults: {},
        searchLoading: {},
        lastCleanup: Date.now()
      };
    },
    
    // Mark videos as seen (reset counter)
    markNewVideosSeen: (state, action) => {
      const feedName = action.payload;
      state.newVideoCount[feedName] = 0;
    },
    
    // Efficient video updates (for likes, etc.)
    updateVideoInCache: (state, action) => {
      const { feedName, videoId, updates } = action.payload;
      const feed = state.feeds[feedName];
      
      if (feed?.videos) {
        const videoIndex = feed.videos.findIndex(video => {
          const vId = video.id?.videoId || video.snippet?.resourceId?.videoId || video.id;
          return vId === videoId;
        });
        
        if (videoIndex !== -1) {
          Object.assign(feed.videos[videoIndex], updates);
        }
      }
    },
    
    // Remove video from cache
    removeVideoFromCache: (state, action) => {
      const { feedName, videoId } = action.payload;
      const feed = state.feeds[feedName];
      
      if (feed?.videos) {
        feed.videos = feed.videos.filter(video => {
          const vId = video.id?.videoId || video.snippet?.resourceId?.videoId || video.id;
          return vId !== videoId;
        });
      }
    },
    
    // Background cleanup of stale data
    cleanup: (state) => {
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour
      
      // Clean stale feeds
      Object.keys(state.feeds).forEach(feedName => {
        const feed = state.feeds[feedName];
        if (!feed.lastFetched || (now - feed.lastFetched) > maxAge) {
          delete state.feeds[feedName];
          delete state.loading[feedName];
          delete state.error[feedName];
          delete state.newVideoCount[feedName];
        }
      });
      
      // Clean stale channel details
      Object.keys(state.channelDetails).forEach(channelId => {
        const details = state.channelDetails[channelId];
        if (!details.fetchedAt || (now - details.fetchedAt) > maxAge) {
          delete state.channelDetails[channelId];
        }
      });
      
      state.lastCleanup = now;
    },
    
    // Cancel loading states
    cancelLoading: (state, action) => {
      const feedName = action.payload;
      delete state.loading[feedName];
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchFeedVideos optimizations
      .addCase(fetchFeedVideos.pending, (state, action) => {
        const { feedName } = action.meta.arg;
        state.loading[feedName] = true;
        delete state.error[feedName];
      })
      .addCase(fetchFeedVideos.fulfilled, (state, action) => {
        const { 
          feedName, 
          videos, 
          channels, 
          fromCache, 
          hasNewVideos, 
          lastFetched, 
          lastIncrementalCheck,
          errors,
          cacheHit
        } = action.payload;
        
        delete state.loading[feedName];
        
        // Update feed data
        state.feeds[feedName] = {
          videos,
          channels,
          lastFetched,
          lastIncrementalCheck: lastIncrementalCheck || lastFetched,
          errors
        };
        
        // Update new video counter
        if (hasNewVideos && !fromCache && !cacheHit) {
          state.newVideoCount[feedName] = (state.newVideoCount[feedName] || 0) + 
            (Array.isArray(videos) ? Math.min(videos.length, 10) : 1);
        }
      })
      .addCase(fetchFeedVideos.rejected, (state, action) => {
        const { feedName } = action.meta.arg;
        delete state.loading[feedName];
        
        if (action.error.message !== 'Aborted') {
          state.error[feedName] = action.error.message;
        }
      })
      
      // checkForNewVideos optimizations
      .addCase(checkForNewVideos.fulfilled, (state, action) => {
        const { feedName, hasNewVideos, newVideos, lastIncrementalCheck } = action.payload;
        
        const feed = state.feeds[feedName];
        if (feed) {
          feed.lastIncrementalCheck = lastIncrementalCheck;
          
          if (hasNewVideos && newVideos.length > 0) {
            // Deduplicate videos before adding
            const existingVideoIds = new Set(
              feed.videos.map(video => 
                video.id?.videoId || video.snippet?.resourceId?.videoId || video.id
              )
            );
            
            const uniqueNewVideos = newVideos.filter(video => {
              const videoId = video.id?.videoId || video.snippet?.resourceId?.videoId || video.id;
              return videoId && !existingVideoIds.has(videoId);
            });
            
            if (uniqueNewVideos.length > 0) {
              // Add to beginning and maintain sort order
              feed.videos = [...uniqueNewVideos, ...feed.videos]
                .sort((a, b) => new Date(b.snippet?.publishedAt) - new Date(a.snippet?.publishedAt));
              
              state.newVideoCount[feedName] = 
                (state.newVideoCount[feedName] || 0) + uniqueNewVideos.length;
            }
          }
        }
      })
      
      // refreshChannelVideos optimizations
      .addCase(refreshChannelVideos.fulfilled, (state, action) => {
        const { channelId, feedName, videos, channelDetails, lastFetched } = action.payload;
        
        const feed = state.feeds[feedName];
        if (feed) {
          // Remove old videos from this channel efficiently
          feed.videos = feed.videos.filter(
            video => video.snippet?.channelId !== channelId
          );
          
          // Add new videos and maintain sort
          feed.videos = [...feed.videos, ...videos]
            .sort((a, b) => new Date(b.snippet?.publishedAt) - new Date(a.snippet?.publishedAt));
          
          // Update metadata
          feed.channels[channelId] = channelDetails;
          feed.lastFetched = lastFetched;
        }
        
        // Update global channel cache
        state.channelDetails[channelId] = {
          data: channelDetails,
          fetchedAt: lastFetched
        };
      });
  },
});

// Memoized selectors for performance
export const selectFeedVideos = createSelector(
  [(state) => state.videoCache.feeds, (_, feedName) => feedName],
  (feeds, feedName) => feeds[feedName]?.videos || []
);

export const selectFeedChannels = createSelector(
  [(state) => state.videoCache.feeds, (_, feedName) => feedName],
  (feeds, feedName) => feeds[feedName]?.channels || {}
);

export const selectFeedLoading = createSelector(
  [(state) => state.videoCache.loading, (_, feedName) => feedName],
  (loading, feedName) => !!loading[feedName]
);

export const selectFeedError = createSelector(
  [(state) => state.videoCache.error, (_, feedName) => feedName],
  (error, feedName) => error[feedName]
);

export const selectChannelDetails = createSelector(
  [(state) => state.videoCache.channelDetails, (_, channelId) => channelId],
  (channelDetails, channelId) => channelDetails[channelId]?.data
);

export const selectNewVideoCount = createSelector(
  [(state) => state.videoCache.newVideoCount, (_, feedName) => feedName],
  (newVideoCount, feedName) => newVideoCount[feedName] || 0
);

export const {
  cacheChannelDetails,
  clearFeedCache,
  clearAllCache,
  markNewVideosSeen,
  updateVideoInCache,
  removeVideoFromCache,
  cleanup,
  cancelLoading
} = videoCacheSlice.actions;

export default videoCacheSlice.reducer;