import { auth, youtubeProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

class YouTubeSubscriptionsFetcher {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Get YouTube access using existing logged-in user
   */
  async getYouTubeAccess() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User must be logged in');

      // Check if we already have a valid token
      const existingToken = await this.getStoredAccessToken(user.uid);
      if (existingToken) {
        return existingToken;
      }

      // Request additional YouTube scope
      const result = await signInWithPopup(auth, youtubeProvider);
      
      // Get the OAuth access token from the result
      const credential = result._tokenResponse;
      
      if (!credential?.oauthAccessToken) {
        throw new Error('Failed to get YouTube access token');
      }

      // Store the token
      await this.storeAccessToken(user.uid, {
        accessToken: credential.oauthAccessToken,
        expiresAt: Date.now() + ((credential.oauthExpiresIn || 3600) * 1000),
        refreshToken: credential.oauthRefreshToken || null,
        grantedAt: new Date().toISOString()
      });

      return credential.oauthAccessToken;
    } catch (error) {
      console.error('Error getting YouTube access:', error);
      throw error;
    }
  }

  /**
   * Store access token in Firestore
   */
  async storeAccessToken(userId, tokenData) {
    try {
      const tokenRef = doc(db, 'userTokens', userId);
      await setDoc(tokenRef, {
        youtube: {
          accessToken: tokenData.accessToken,
          expiresAt: tokenData.expiresAt,
          refreshToken: tokenData.refreshToken,
          grantedAt: tokenData.grantedAt
        },
        updatedAt: new Date().toISOString(),
        userId: userId
      }, { merge: true });
    } catch (error) {
      console.error('Error storing access token:', error);
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  async getStoredAccessToken(userId) {
    try {
      const tokenRef = doc(db, 'userTokens', userId);
      const tokenDoc = await getDoc(tokenRef);
      
      if (!tokenDoc.exists()) {
        return null;
      }

      const data = tokenDoc.data();
      const youtubeData = data.youtube;
      
      if (!youtubeData || !youtubeData.accessToken) {
        return null;
      }

      // Check if token is still valid
      if (youtubeData.expiresAt && youtubeData.expiresAt > Date.now()) {
        return youtubeData.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Error getting stored access token:', error);
      return null;
    }
  }

  /**
   * Check if user has YouTube access
   */
  async hasYouTubeAccess(userId) {
    const token = await this.getStoredAccessToken(userId);
    return !!token;
  }

  /**
   * Fetch user's YouTube subscriptions
   */
  async fetchSubscriptions(accessToken, maxResults = 50) {
    try {
      const cacheKey = `subscriptions_${accessToken.slice(0, 10)}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      let allSubscriptions = [];
      let nextPageToken = null;
      let pageCount = 0;
      const maxPages = 5; // Prevent infinite loops

      do {
        const params = new URLSearchParams({
          part: 'snippet',
          mine: 'true',
          maxResults: '50', // Max allowed per request
          order: 'alphabetical'
        });

        if (nextPageToken) {
          params.append('pageToken', nextPageToken);
        }

        const url = `${this.baseURL}/subscriptions?${params}&access_token=${accessToken}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`YouTube API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        const pageSubscriptions = data.items?.map(item => ({
          id: item.snippet.resourceId.channelId,
          title: item.snippet.title,
          description: item.snippet.description || '',
          thumbnail: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelId: item.snippet.resourceId.channelId
        })) || [];

        allSubscriptions = [...allSubscriptions, ...pageSubscriptions];
        nextPageToken = data.nextPageToken;
        pageCount++;
        
        // Break if we have enough or hit max pages
        if (allSubscriptions.length >= maxResults || pageCount >= maxPages) {
          break;
        }
      } while (nextPageToken);

      // Limit to requested amount
      const subscriptions = allSubscriptions.slice(0, maxResults);

      // Cache the results
      this.cache.set(cacheKey, {
        data: subscriptions,
        timestamp: Date.now()
      });

      return subscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * Cache subscriptions to Firestore
   */
  async cacheSubscriptions(userId, subscriptions) {
    try {
      const subsRef = doc(db, 'userSubscriptions', userId);
      await setDoc(subsRef, {
        subscriptions,
        lastUpdated: new Date().toISOString(),
        totalCount: subscriptions.length,
        userId: userId
      });
    } catch (error) {
      console.error('Error caching subscriptions:', error);
    }
  }

  /**
   * Get cached subscriptions from Firestore
   */
  async getCachedSubscriptions(userId) {
    try {
      const subsRef = doc(db, 'userSubscriptions', userId);
      const subsDoc = await getDoc(subsRef);
      
      if (subsDoc.exists()) {
        const data = subsDoc.data();
        return {
          subscriptions: data.subscriptions || [],
          lastUpdated: data.lastUpdated,
          totalCount: data.totalCount || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached subscriptions:', error);
      return null;
    }
  }

  /**
   * Get user subscriptions with fallback to cache
   */
  async getUserSubscriptions(userId, forceRefresh = false) {
    try {
      // If force refresh or no cache, try to get fresh data
      if (forceRefresh) {
        const accessToken = await this.getStoredAccessToken(userId);
        if (accessToken) {
          const subscriptions = await this.fetchSubscriptions(accessToken);
          await this.cacheSubscriptions(userId, subscriptions);
          return subscriptions;
        }
      }
      
      // Try cached data first
      const cached = await this.getCachedSubscriptions(userId);
      if (cached && cached.subscriptions.length > 0) {
        return cached.subscriptions;
      }
      
      // No cached data, try to fetch fresh
      const accessToken = await this.getStoredAccessToken(userId);
      if (accessToken) {
        const subscriptions = await this.fetchSubscriptions(accessToken);
        await this.cacheSubscriptions(userId, subscriptions);
        return subscriptions;
      }
      
      // No access token, return empty
      return null;
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      
      // Fallback to cached data even if there's an error
      const cached = await this.getCachedSubscriptions(userId);
      if (cached) {
        return cached.subscriptions;
      }
      
      throw error;
    }
  }

  /**
   * Fetch latest videos from a channel
   */
  async fetchChannelVideos(channelId, accessToken, maxResults = 20) {
    try {
      const cacheKey = `channel_videos_${channelId}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      // Get channel's uploads playlist
      const channelUrl = `${this.baseURL}/channels?part=contentDetails&id=${channelId}&access_token=${accessToken}`;
      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json();
      
      if (!channelData.items?.length) {
        throw new Error('Channel not found');
      }

      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

      // Get videos from uploads playlist
      const videosUrl = `${this.baseURL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&access_token=${accessToken}`;
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

      // Cache the results
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
}

// Export singleton instance
export const youtubeSubscriptionsFetcher = new YouTubeSubscriptionsFetcher();
export default youtubeSubscriptionsFetcher;