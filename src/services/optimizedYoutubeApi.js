import { config } from '../config/config.js';

// Enhanced caching system
class APICache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  set(key, value, maxAge = this.maxAge) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      maxAge
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// Cache instances
const videoCache = new APICache(10 * 60 * 1000); // 10 minutes for video data
const channelCache = new APICache(30 * 60 * 1000); // 30 minutes for channel data
const durationCache = new APICache(60 * 60 * 1000); // 1 hour for video durations

// Request queue for batching
class RequestQueue {
  constructor(batchSize = 50, delay = 100) {
    this.queue = [];
    this.batchSize = batchSize;
    this.delay = delay;
    this.processing = false;
  }

  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    await new Promise(resolve => setTimeout(resolve, this.delay));
    
    const batch = this.queue.splice(0, this.batchSize);
    const groupedRequests = this.groupRequests(batch);
    
    await Promise.all(Object.entries(groupedRequests).map(([type, requests]) => 
      this.processBatch(type, requests)
    ));
    
    this.processing = false;
    
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  groupRequests(batch) {
    const groups = {
      videoDurations: [],
      videoDetails: [],
      channelDetails: []
    };
    
    batch.forEach(request => {
      if (groups[request.type]) {
        groups[request.type].push(request);
      }
    });
    
    return groups;
  }

  async processBatch(type, requests) {
    if (requests.length === 0) return;
    
    try {
      switch (type) {
        case 'videoDurations':
          await this.batchVideoDurations(requests);
          break;
        case 'videoDetails':
          await this.batchVideoDetails(requests);
          break;
        case 'channelDetails':
          await this.batchChannelDetails(requests);
          break;
        default:
          requests.forEach(req => req.reject(new Error('Unknown request type')));
      }
    } catch (error) {
      requests.forEach(req => req.reject(error));
    }
  }

  async batchVideoDurations(requests) {
    const videoIds = requests.map(req => req.videoId).join(',');
    const cacheKey = `durations-${videoIds}`;
    
    let cachedResult = videoCache.get(cacheKey);
    if (cachedResult) {
      requests.forEach((req, index) => {
        req.resolve(cachedResult[index] || null);
      });
      return;
    }
    
    const response = await fetch(
      `${config.youtube.baseUrl}/videos?part=contentDetails&id=${videoIds}&key=${config.youtube.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const durations = requests.map(req => {
      const video = data.items?.find(item => item.id === req.videoId);
      return video?.contentDetails?.duration || null;
    });
    
    videoCache.set(cacheKey, durations);
    
    requests.forEach((req, index) => {
      const duration = durations[index];
      if (duration) {
        durationCache.set(req.videoId, duration);
      }
      req.resolve(duration);
    });
  }

  async batchVideoDetails(requests) {
    const videoIds = requests.map(req => req.videoId).join(',');
    const cacheKey = `videos-${videoIds}`;
    
    let cachedResult = videoCache.get(cacheKey);
    if (cachedResult) {
      requests.forEach((req, index) => {
        req.resolve(cachedResult[index] || null);
      });
      return;
    }
    
    const response = await fetch(
      `${config.youtube.baseUrl}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${config.youtube.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const videos = requests.map(req => {
      return data.items?.find(item => item.id === req.videoId) || null;
    });
    
    videoCache.set(cacheKey, videos);
    
    requests.forEach((req, index) => {
      req.resolve(videos[index]);
    });
  }

  async batchChannelDetails(requests) {
    const channelIds = [...new Set(requests.map(req => req.channelId))].join(',');
    const cacheKey = `channels-${channelIds}`;
    
    let cachedResult = channelCache.get(cacheKey);
    if (cachedResult) {
      requests.forEach(req => {
        const channel = cachedResult.find(ch => ch.id === req.channelId);
        req.resolve(channel || null);
      });
      return;
    }
    
    const response = await fetch(
      `${config.youtube.baseUrl}/channels?part=snippet,statistics&id=${channelIds}&key=${config.youtube.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    channelCache.set(cacheKey, data.items || []);
    
    requests.forEach(req => {
      const channel = data.items?.find(item => item.id === req.channelId) || null;
      req.resolve(channel);
    });
  }
}

const requestQueue = new RequestQueue();

// Optimized API functions
export const getVideoDuration = async (videoId) => {
  if (!videoId) return null;
  
  // Check individual cache first
  const cached = durationCache.get(videoId);
  if (cached) return cached;
  
  try {
    const duration = await requestQueue.add({
      type: 'videoDurations',
      videoId
    });
    return duration;
  } catch (error) {
    console.error('Error fetching video duration:', error);
    return null;
  }
};

export const getVideoDetails = async (videoId) => {
  if (!videoId) return null;
  
  const cacheKey = `video-${videoId}`;
  const cached = videoCache.get(cacheKey);
  if (cached) return cached;
  
  try {
    const video = await requestQueue.add({
      type: 'videoDetails',
      videoId
    });
    
    if (video) {
      videoCache.set(cacheKey, video);
    }
    
    return video;
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
};

export const getChannelDetails = async (channelId) => {
  if (!channelId) return null;
  
  const cacheKey = `channel-${channelId}`;
  const cached = channelCache.get(cacheKey);
  if (cached) return cached;
  
  try {
    const channel = await requestQueue.add({
      type: 'channelDetails',
      channelId
    });
    
    if (channel) {
      channelCache.set(cacheKey, channel);
    }
    
    return channel;
  } catch (error) {
    console.error('Error fetching channel details:', error);
    return null;
  }
};

// Utility function to preload video data
export const preloadVideoData = async (videoIds) => {
  if (!videoIds || videoIds.length === 0) return;
  
  const uncachedIds = videoIds.filter(id => !videoCache.get(`video-${id}`));
  if (uncachedIds.length === 0) return;
  
  try {
    await Promise.all(uncachedIds.map(videoId => 
      requestQueue.add({
        type: 'videoDetails',
        videoId
      })
    ));
  } catch (error) {
    console.error('Error preloading video data:', error);
  }
};

// Utility function to preload channel data
export const preloadChannelData = async (channelIds) => {
  if (!channelIds || channelIds.length === 0) return;
  
  const uncachedIds = channelIds.filter(id => !channelCache.get(`channel-${id}`));
  if (uncachedIds.length === 0) return;
  
  try {
    await Promise.all(uncachedIds.map(channelId => 
      requestQueue.add({
        type: 'channelDetails',
        channelId
      })
    ));
  } catch (error) {
    console.error('Error preloading channel data:', error);
  }
};

// Parse ISO 8601 duration to readable format
export const parseDuration = (isoDuration) => {
  if (!isoDuration) return "0:00";
  
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
};

// Clear caches (useful for memory management)
export const clearCache = () => {
  videoCache.clear();
  channelCache.clear();
  durationCache.clear();
};

// Export original functions for backward compatibility
export * from './youtubeApi.js';
