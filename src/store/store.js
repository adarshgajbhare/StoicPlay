import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import feedsReducer from './feedsSlice';
import videoCacheReducer from './videoCacheSlice';

// High-performance async persistence middleware
const createAsyncPersistenceMiddleware = () => {
  let persistQueue = Promise.resolve();
  let lastPersistTime = 0;
  const PERSIST_THROTTLE = 1000; // 1 second throttle

  return (store) => (next) => (action) => {
    const result = next(action);
    
    // Only persist video cache actions and throttle writes
    if (action.type?.startsWith('videoCache/')) {
      const now = Date.now();
      
      // Throttle persistence to avoid blocking UI
      if (now - lastPersistTime > PERSIST_THROTTLE) {
        lastPersistTime = now;
        
        // Queue persistence to avoid blocking
        persistQueue = persistQueue.then(async () => {
          try {
            await new Promise(resolve => {
              // Use requestIdleCallback for non-blocking persistence
              const callback = () => {
                try {
                  const state = store.getState();
                  const { feeds, channelDetails } = state.videoCache;
                  
                  // Only persist valid, recent feeds
                  const maxAge = 60 * 60 * 1000; // 1 hour
                  const validFeeds = {};
                  
                  Object.entries(feeds).forEach(([feedName, feedData]) => {
                    if (feedData.lastFetched && (now - feedData.lastFetched) < maxAge) {
                      // Only store essential data to reduce payload
                      validFeeds[feedName] = {
                        videos: feedData.videos.slice(0, 100), // Limit to 100 videos
                        channels: feedData.channels,
                        lastFetched: feedData.lastFetched,
                        lastIncrementalCheck: feedData.lastIncrementalCheck
                      };
                    }
                  });
                  
                  // Compress channel details
                  const compressedChannelDetails = {};
                  Object.entries(channelDetails).forEach(([channelId, details]) => {
                    if (details.fetchedAt && (now - details.fetchedAt) < maxAge) {
                      compressedChannelDetails[channelId] = {
                        data: {
                          id: details.data?.id,
                          snippet: {
                            title: details.data?.snippet?.title,
                            thumbnails: details.data?.snippet?.thumbnails,
                            customUrl: details.data?.snippet?.customUrl
                          },
                          statistics: details.data?.statistics
                        },
                        fetchedAt: details.fetchedAt
                      };
                    }
                  });
                  
                  const cacheData = {
                    feeds: validFeeds,
                    channelDetails: compressedChannelDetails,
                    timestamp: now
                  };
                  
                  localStorage.setItem('stoicplay_video_cache', JSON.stringify(cacheData));
                  resolve();
                } catch (error) {
                  console.warn('Failed to persist video cache:', error);
                  resolve();
                }
              };
              
              // Use requestIdleCallback if available, otherwise setTimeout
              if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(callback, { timeout: 2000 });
              } else {
                setTimeout(callback, 0);
              }
            });
          } catch (error) {
            console.warn('Persistence error:', error);
          }
        }).catch(console.warn);
      }
    }
    
    return result;
  };
};

// Optimized cache loader with error handling
const loadPersistedCache = () => {
  try {
    const cached = localStorage.getItem('stoicplay_video_cache');
    if (!cached) return undefined;
    
    const { feeds, channelDetails, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    // Validate cache age
    if (!timestamp || (now - timestamp) > maxAge) {
      localStorage.removeItem('stoicplay_video_cache');
      return undefined;
    }
    
    return {
      feeds: feeds || {},
      channelDetails: channelDetails || {},
      loading: {},
      error: {},
      newVideoCount: {},
      searchResults: {},
      searchLoading: {}
    };
  } catch (error) {
    console.warn('Failed to load persisted cache, clearing:', error);
    localStorage.removeItem('stoicplay_video_cache');
    return undefined;
  }
};

// Performance-optimized store configuration
const store = configureStore({
  reducer: {
    auth: authReducer,
    feeds: feedsReducer,
    videoCache: videoCacheReducer,
  },
  preloadedState: {
    videoCache: loadPersistedCache()
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Optimize serializable check for better performance
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'videoCache/fetchFeedVideos/fulfilled',
          'videoCache/fetchFeedVideos/pending',
          'videoCache/checkForNewVideos/fulfilled'
        ],
        ignoredPaths: ['videoCache.loading', 'videoCache.error'],
        // Reduce check frequency for performance
        warnAfter: 128,
      },
      immutableCheck: {
        // Reduce immutable check overhead
        warnAfter: 128,
        ignoredPaths: ['videoCache.feeds', 'videoCache.channelDetails']
      },
      // Enable thunk for better async handling
      thunk: {
        extraArgument: {
          // Add any extra arguments for thunks if needed
        }
      }
    }).concat(createAsyncPersistenceMiddleware()),
  
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV === 'development',
  
  // Enhance store with performance optimizations
  enhancers: (getDefaultEnhancers) => {
    return getDefaultEnhancers({
      // Optimize for production
      autoBatch: true,
    });
  }
});

// Clean up old cache on app start (non-blocking)
setTimeout(() => {
  store.dispatch({ type: 'videoCache/cleanup' });
}, 1000);

// Performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  let lastStateChange = Date.now();
  store.subscribe(() => {
    const now = Date.now();
    const timeSinceLastChange = now - lastStateChange;
    
    if (timeSinceLastChange > 100) {
      console.warn('Slow state update detected:', timeSinceLastChange, 'ms');
    }
    
    lastStateChange = now;
  });
}

export default store;