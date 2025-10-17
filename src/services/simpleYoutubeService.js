import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

class SimpleYouTubeService {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Get channel info by channel URL or handle
   */
  async getChannelByHandle(handle) {
    try {
      // Remove @ if present
      const cleanHandle = handle.replace('@', '');
      
      const url = `${this.baseURL}/channels?` + new URLSearchParams({
        part: 'snippet,contentDetails',
        forHandle: cleanHandle,
        key: this.apiKey
      });

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnail: channel.snippet.thumbnails?.default?.url,
          uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting channel by handle:', error);
      throw error;
    }
  }

  /**
   * Search for channels by name
   */
  async searchChannels(query, maxResults = 10) {
    try {
      const cacheKey = `search_channels_${query}`;
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const url = `${this.baseURL}/search?` + new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'channel',
        maxResults: maxResults.toString(),
        key: this.apiKey
      });

      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`YouTube API Error: ${data.error?.message || response.statusText}`);
      }
      
      const channels = data.items?.map(item => ({
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url,
        publishedAt: item.snippet.publishedAt,
        channelId: item.id.channelId
      })) || [];

      this.cache.set(cacheKey, {
        data: channels,
        timestamp: Date.now()
      });

      return channels;
    } catch (error) {
      console.error('Error searching channels:', error);
      throw error;
    }
  }

  /**
   * Get videos from a channel
   */
  async getChannelVideos(channelId, maxResults = 20) {
    try {
      const cacheKey = `channel_videos_${channelId}`;
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      // First get the channel's uploads playlist ID
      const channelUrl = `${this.baseURL}/channels?` + new URLSearchParams({
        part: 'contentDetails',
        id: channelId,
        key: this.apiKey
      });

      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json();
      
      if (!channelData.items?.length) {
        throw new Error('Channel not found');
      }

      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

      // Get videos from the uploads playlist
      const videosUrl = `${this.baseURL}/playlistItems?` + new URLSearchParams({
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: maxResults.toString(),
        key: this.apiKey
      });

      const videosResponse = await fetch(videosUrl);
      const videosData = await videosResponse.json();

      if (!videosResponse.ok) {
        throw new Error(`YouTube API Error: ${videosData.error?.message || videosResponse.statusText}`);
      }

      const videos = videosData.items?.map(item => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId
      })) || [];

      this.cache.set(cacheKey, {
        data: videos,
        timestamp: Date.now()
      });

      return videos;
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  }

  /**
   * Add a channel to user's subscriptions
   */
  async addSubscription(userId, channel) {
    try {
      const userSubsRef = doc(db, 'userSubscriptions', userId);
      const subsDoc = await getDoc(userSubsRef);
      
      let subscriptions = [];
      if (subsDoc.exists()) {
        subscriptions = subsDoc.data().subscriptions || [];
      }
      
      // Check if already subscribed
      if (subscriptions.find(sub => sub.id === channel.id)) {
        throw new Error('Already subscribed to this channel');
      }
      
      subscriptions.push({
        id: channel.id,
        title: channel.title,
        description: channel.description,
        thumbnail: channel.thumbnail,
        channelId: channel.id,
        addedAt: new Date().toISOString()
      });
      
      await setDoc(userSubsRef, {
        subscriptions,
        lastUpdated: new Date().toISOString(),
        totalCount: subscriptions.length,
        userId: userId
      });
      
      return true;
    } catch (error) {
      console.error('Error adding subscription:', error);
      throw error;
    }
  }

  /**
   * Remove a channel from user's subscriptions
   */
  async removeSubscription(userId, channelId) {
    try {
      const userSubsRef = doc(db, 'userSubscriptions', userId);
      const subsDoc = await getDoc(userSubsRef);
      
      if (!subsDoc.exists()) {
        throw new Error('No subscriptions found');
      }
      
      let subscriptions = subsDoc.data().subscriptions || [];
      subscriptions = subscriptions.filter(sub => sub.id !== channelId);
      
      await setDoc(userSubsRef, {
        subscriptions,
        lastUpdated: new Date().toISOString(),
        totalCount: subscriptions.length,
        userId: userId
      });
      
      return true;
    } catch (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's manual subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      const userSubsRef = doc(db, 'userSubscriptions', userId);
      const subsDoc = await getDoc(userSubsRef);
      
      if (subsDoc.exists()) {
        const data = subsDoc.data();
        return data.subscriptions || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return [];
    }
  }

  /**
   * Check if user is subscribed to a channel
   */
  async isSubscribed(userId, channelId) {
    try {
      const subscriptions = await this.getUserSubscriptions(userId);
      return subscriptions.some(sub => sub.id === channelId);
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Get trending videos (popular videos)
   */
  async getTrendingVideos(maxResults = 20) {
    try {
      const cacheKey = 'trending_videos';
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const url = `${this.baseURL}/videos?` + new URLSearchParams({
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: 'US',
        maxResults: maxResults.toString(),
        key: this.apiKey
      });

      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`YouTube API Error: ${data.error?.message || response.statusText}`);
      }
      
      const videos = data.items?.map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        viewCount: item.statistics?.viewCount
      })) || [];

      this.cache.set(cacheKey, {
        data: videos,
        timestamp: Date.now()
      });

      return videos;
    } catch (error) {
      console.error('Error getting trending videos:', error);
      throw error;
    }
  }
}

export const simpleYouTubeService = new SimpleYouTubeService();
export default simpleYouTubeService;