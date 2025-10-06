import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchChannelVideos,
  fetchChannelDetails,
  fetchChannelUploadsPlaylistId,
  fetchVideosForChannel,
} from '../services/youtubeApi';
import { preloadVideoData, preloadChannelData } from '../services/optimizedYoutubeApi';

// Async thunk for fetching videos with intelligent caching
export const fetchFeedVideos = createAsyncThunk(
  'videoCache/fetchFeedVideos',
  async ({ channelIds, feedName, forceRefresh = false }, { getState, dispatch }) => {
    const state = getState();
    const feedCache = state.videoCache.feeds[feedName];
    const now = Date.now();
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
    const INCREMENTAL_CHECK_DURATION = 5 * 60 * 1000; // 5 minutes

    // Check if we have recent cache and don't need refresh
    if (!forceRefresh && feedCache) {
      const isRecentCache = (now - feedCache.lastFetched) < CACHE_DURATION;
      const shouldIncrementalCheck = (now - feedCache.lastIncrementalCheck) < INCREMENTAL_CHECK_DURATION;
      
      if (isRecentCache && shouldIncrementalCheck) {
        // Return cached data immediately
        return {
          feedName,
          videos: feedCache.videos,
          channels: feedCache.channels,
          fromCache: true,
          lastFetched: feedCache.lastFetched,
          lastIncrementalCheck: feedCache.lastIncrementalCheck
        };
      }
    }

    try {
      // Fetch channel details first (with caching)
      const channelDetails = new Map();
      const channelDetailsPromises = channelIds.map(async (channelId) => {
        // Check if we have cached channel details
        const cachedChannel = state.videoCache.channelDetails[channelId];
        if (cachedChannel && (now - cachedChannel.fetchedAt) < 30 * 60 * 1000) {
          channelDetails.set(channelId, cachedChannel.data);
          return cachedChannel.data;
        }
        
        // Fetch fresh channel details
        const details = await fetchChannelDetails(channelId);
        if (details) {
          channelDetails.set(channelId, details);
          // Cache channel details separately
          dispatch(cacheChannelDetails({ channelId, details, fetchedAt: now }));
        }
        return details;
      });

      await Promise.all(channelDetailsPromises);

      // Fetch videos for each channel
      let allVideos = [];
      let hasNewVideos = false;
      
      for (const channelId of channelIds) {
        try {
          const channelVideos = await fetchChannelVideos(channelId);
          
          // Check for new videos if we have cache
          if (feedCache && !forceRefresh) {
            const cachedChannelVideos = feedCache.videos.filter(
              video => video.snippet?.channelId === channelId
            );
            
            // Compare latest video dates to detect new content
            if (channelVideos.length > 0 && cachedChannelVideos.length > 0) {
              const latestNewVideo = new Date(channelVideos[0]?.snippet?.publishedAt);
              const latestCachedVideo = new Date(cachedChannelVideos[0]?.snippet?.publishedAt);
              
              if (latestNewVideo > latestCachedVideo) {
                hasNewVideos = true;
              }
            }
          }
          
          allVideos = allVideos.concat(channelVideos);
        } catch (error) {
          console.error(`Error fetching videos for channel ${channelId}:`, error);
          // If there's an error, use cached videos for this channel if available
          if (feedCache) {
            const cachedChannelVideos = feedCache.videos.filter(
              video => video.snippet?.channelId === channelId
            );
            allVideos = allVideos.concat(cachedChannelVideos);
          }
        }
      }

      // Sort videos by publish date (newest first)
      allVideos.sort((a, b) => 
        new Date(b.snippet?.publishedAt) - new Date(a.snippet?.publishedAt)
      );

      // Preload video data for better performance
      const videoIds = allVideos.slice(0, 20).map(video => {
        if (video.id?.videoId) return video.id.videoId;
        if (video.snippet?.resourceId?.videoId) return video.snippet.resourceId.videoId;
        return video.id;
      }).filter(Boolean);

      // Preload in background (don't await)
      Promise.all([
        preloadVideoData(videoIds),
        preloadChannelData(channelIds)
      ]).catch(console.error);

      return {
        feedName,
        videos: allVideos,
        channels: Object.fromEntries(channelDetails),
        fromCache: false,
        hasNewVideos,
        lastFetched: now,
        lastIncrementalCheck: now
      };
    } catch (error) {
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
          lastIncrementalCheck: now
        };
      }
      
      throw error;
    }
  }
);

// Async thunk for incremental updates (check for new videos only)
export const checkForNewVideos = createAsyncThunk(
  'videoCache/checkForNewVideos',
  async ({ channelIds, feedName }, { getState, dispatch }) => {
    const state = getState();
    const feedCache = state.videoCache.feeds[feedName];
    
    if (!feedCache) {
      // No cache, do full fetch
      return dispatch(fetchFeedVideos({ channelIds, feedName }));
    }

    const now = Date.now();
    let hasNewVideos = false;
    const newVideos = [];

    try {
      // Quick check: fetch only latest video from each channel
      for (const channelId of channelIds) {
        const uploadsPlaylistId = await fetchChannelUploadsPlaylistId(channelId);
        const latestVideos = await fetchVideosForChannel(uploadsPlaylistId, 1); // Fetch only 1 latest video
        
        if (latestVideos.length > 0) {
          const latestVideo = latestVideos[0];
          const latestVideoDate = new Date(latestVideo.snippet?.publishedAt);
          
          // Check if this video is newer than our cached latest
          const cachedChannelVideos = feedCache.videos.filter(
            video => video.snippet?.channelId === channelId
          );
          
          if (cachedChannelVideos.length > 0) {
            const cachedLatestDate = new Date(cachedChannelVideos[0]?.snippet?.publishedAt);
            
            if (latestVideoDate > cachedLatestDate) {
              hasNewVideos = true;
              newVideos.push(latestVideo);
            }
          } else {
            // No cached videos for this channel
            hasNewVideos = true;
            newVideos.push(latestVideo);
          }
        }
      }

      return {
        feedName,
        hasNewVideos,
        newVideos,
        lastIncrementalCheck: now
      };
    } catch (error) {
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

// Async thunk for refreshing a single channel
export const refreshChannelVideos = createAsyncThunk(
  'videoCache/refreshChannelVideos',
  async ({ channelId, feedName }, { getState, dispatch }) => {
    try {
      const videos = await fetchChannelVideos(channelId);
      const channelDetails = await fetchChannelDetails(channelId);
      
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
    feeds: {}, // { feedName: { videos: [], channels: {}, lastFetched: timestamp, lastIncrementalCheck: timestamp } }
    channelDetails: {}, // { channelId: { data: {}, fetchedAt: timestamp } }
    loading: {},
    error: {},
    newVideoCount: {}, // { feedName: number }
  },
  reducers: {
    // Cache channel details separately
    cacheChannelDetails: (state, action) => {
      const { channelId, details, fetchedAt } = action.payload;
      state.channelDetails[channelId] = {
        data: details,
        fetchedAt
      };
    },
    
    // Clear cache for specific feed
    clearFeedCache: (state, action) => {
      const feedName = action.payload;
      delete state.feeds[feedName];
      delete state.loading[feedName];
      delete state.error[feedName];
      delete state.newVideoCount[feedName];
    },
    
    // Clear all cache
    clearAllCache: (state) => {
      state.feeds = {};
      state.channelDetails = {};
      state.loading = {};
      state.error = {};
      state.newVideoCount = {};
    },
    
    // Mark new videos as seen
    markNewVideosSeen: (state, action) => {
      const feedName = action.payload;
      state.newVideoCount[feedName] = 0;
    },
    
    // Update video in cache (for like/unlike, watch later, etc.)
    updateVideoInCache: (state, action) => {
      const { feedName, videoId, updates } = action.payload;
      const feed = state.feeds[feedName];
      
      if (feed) {
        const videoIndex = feed.videos.findIndex(video => {
          const vId = video.id?.videoId || video.snippet?.resourceId?.videoId || video.id;
          return vId === videoId;
        });
        
        if (videoIndex !== -1) {
          feed.videos[videoIndex] = { ...feed.videos[videoIndex], ...updates };
        }
      }
    },
    
    // Remove video from cache
    removeVideoFromCache: (state, action) => {
      const { feedName, videoId } = action.payload;
      const feed = state.feeds[feedName];
      
      if (feed) {
        feed.videos = feed.videos.filter(video => {
          const vId = video.id?.videoId || video.snippet?.resourceId?.videoId || video.id;
          return vId !== videoId;
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchFeedVideos cases
      .addCase(fetchFeedVideos.pending, (state, action) => {
        const { feedName } = action.meta.arg;
        state.loading[feedName] = true;
        state.error[feedName] = null;
      })
      .addCase(fetchFeedVideos.fulfilled, (state, action) => {
        const { feedName, videos, channels, fromCache, hasNewVideos, lastFetched, lastIncrementalCheck } = action.payload;
        
        state.loading[feedName] = false;
        state.feeds[feedName] = {
          videos,
          channels,
          lastFetched,
          lastIncrementalCheck: lastIncrementalCheck || lastFetched
        };
        
        if (hasNewVideos && !fromCache) {
          state.newVideoCount[feedName] = (state.newVideoCount[feedName] || 0) + 1;
        }
      })
      .addCase(fetchFeedVideos.rejected, (state, action) => {
        const { feedName } = action.meta.arg;
        state.loading[feedName] = false;
        state.error[feedName] = action.error.message;
      })
      
      // checkForNewVideos cases
      .addCase(checkForNewVideos.fulfilled, (state, action) => {
        const { feedName, hasNewVideos, newVideos, lastIncrementalCheck } = action.payload;
        
        if (state.feeds[feedName]) {
          state.feeds[feedName].lastIncrementalCheck = lastIncrementalCheck;
          
          if (hasNewVideos && newVideos.length > 0) {
            // Add new videos to the beginning of the cache
            const existingVideoIds = new Set(
              state.feeds[feedName].videos.map(video => 
                video.id?.videoId || video.snippet?.resourceId?.videoId || video.id
              )
            );
            
            const uniqueNewVideos = newVideos.filter(video => {
              const videoId = video.id?.videoId || video.snippet?.resourceId?.videoId || video.id;
              return !existingVideoIds.has(videoId);
            });
            
            if (uniqueNewVideos.length > 0) {
              state.feeds[feedName].videos = [...uniqueNewVideos, ...state.feeds[feedName].videos];
              state.newVideoCount[feedName] = (state.newVideoCount[feedName] || 0) + uniqueNewVideos.length;
            }
          }
        }
      })
      
      // refreshChannelVideos cases
      .addCase(refreshChannelVideos.fulfilled, (state, action) => {
        const { channelId, feedName, videos, channelDetails, lastFetched } = action.payload;
        
        if (state.feeds[feedName]) {
          // Remove old videos from this channel
          state.feeds[feedName].videos = state.feeds[feedName].videos.filter(
            video => video.snippet?.channelId !== channelId
          );
          
          // Add new videos and sort by date
          state.feeds[feedName].videos = [...state.feeds[feedName].videos, ...videos]
            .sort((a, b) => new Date(b.snippet?.publishedAt) - new Date(a.snippet?.publishedAt));
          
          // Update channel details
          state.feeds[feedName].channels[channelId] = channelDetails;
          state.feeds[feedName].lastFetched = lastFetched;
        }
        
        // Update global channel cache
        state.channelDetails[channelId] = {
          data: channelDetails,
          fetchedAt: lastFetched
        };
      });
  },
});

export const {
  cacheChannelDetails,
  clearFeedCache,
  clearAllCache,
  markNewVideosSeen,
  updateVideoInCache,
  removeVideoFromCache
} = videoCacheSlice.actions;

export default videoCacheSlice.reducer;
