import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import feedsReducer from './feedsSlice';
import videoCacheReducer from './videoCacheSlice';

// Persistence middleware for video cache
const persistVideoCacheMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Persist video cache to localStorage on specific actions
  if (action.type?.startsWith('videoCache/')) {
    try {
      const state = store.getState();
      const { feeds, channelDetails } = state.videoCache;
      
      // Only persist feeds that are less than 1 hour old
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour
      
      const validFeeds = {};
      Object.entries(feeds).forEach(([feedName, feedData]) => {
        if (feedData.lastFetched && (now - feedData.lastFetched) < maxAge) {
          validFeeds[feedName] = feedData;
        }
      });
      
      // Persist to localStorage
      localStorage.setItem('stoicplay_video_cache', JSON.stringify({
        feeds: validFeeds,
        channelDetails,
        timestamp: now
      }));
    } catch (error) {
      console.warn('Failed to persist video cache:', error);
    }
  }
  
  return result;
};

// Load persisted cache
const loadPersistedCache = () => {
  try {
    const cached = localStorage.getItem('stoicplay_video_cache');
    if (cached) {
      const { feeds, channelDetails, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour
      
      // Only use cache if it's less than 1 hour old
      if ((now - timestamp) < maxAge) {
        return {
          feeds: feeds || {},
          channelDetails: channelDetails || {},
          loading: {},
          error: {},
          newVideoCount: {}
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load persisted cache:', error);
  }
  
  return undefined;
};

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
        // Ignore these action types for serializable check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these paths in the state
        ignoredPaths: ['videoCache.loading', 'videoCache.error']
      }
    }).concat(persistVideoCacheMiddleware),
});

// Clean up old cache on app start
store.dispatch({ type: 'videoCache/cleanup' });

export default store;
