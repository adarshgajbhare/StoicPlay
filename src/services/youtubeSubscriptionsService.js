import { auth, youtubeProvider } from '../lib/firebase';
import { signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

class YouTubeSubscriptionsService {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Request YouTube OAuth consent and get access token
   */
  async requestYouTubeAccess() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User must be logged in');

      // Re-authenticate with YouTube scope
      const result = await signInWithPopup(auth, youtubeProvider);
      const credential = result._tokenResponse;
      
      if (!credential.oauthAccessToken) {
        throw new Error('Failed to get YouTube access token');
      }

      // Store the access token in Firestore for the user
      await this.storeUserTokens(user.uid, {
        accessToken: credential.oauthAccessToken,
        refreshToken: credential.oauthRefreshToken,
        expiresAt: Date.now() + (credential.oauthExpiresIn * 1000),
        scope: credential.oauthIdToken ? 'youtube' : 'basic'
      });

      return credential.oauthAccessToken;
    } catch (error) {
      console.error('Error requesting YouTube access:', error);
      throw error;
    }
  }

  /**
   * Store user OAuth tokens securely in Firestore
   */
  async storeUserTokens(userId, tokenData) {
    try {
      const userTokenRef = doc(db, 'userTokens', userId);
      await setDoc(userTokenRef, {
        youtube: tokenData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error storing user tokens:', error);
      throw error;
    }
  }

  /**
   * Get stored access token for user
   */
  async getUserAccessToken(userId) {
    try {
      const userTokenRef = doc(db, 'userTokens', userId);
      const tokenDoc = await getDoc(userTokenRef);
      
      if (!tokenDoc.exists()) {
        return null;
      }

      const tokenData = tokenDoc.data().youtube;
      
      // Check if token is expired
      if (tokenData && tokenData.expiresAt > Date.now()) {
        return tokenData.accessToken;
      }

      // TODO: Implement token refresh logic here if needed
      return null;
    } catch (error) {
      console.error('Error getting user access token:', error);
      return null;
    }
  }

  /**
   * Fetch user's YouTube subscriptions
   */
  async fetchUserSubscriptions(accessToken, maxResults = 50) {
    try {
      const cacheKey = `subscriptions_${accessToken.substring(0, 10)}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const url = `${this.baseURL}/subscriptions?` + new URLSearchParams({
        part: 'snippet',
        mine: 'true',
        maxResults: maxResults.toString(),
        order: 'alphabetical',
        access_token: accessToken
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`YouTube API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      const subscriptions = data.items?.map(item => ({
        id: item.snippet.resourceId.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url,
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.resourceId.channelId
      })) || [];

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
   * Cache subscriptions in Firestore
   */
  async cacheSubscriptionsToFirestore(userId, subscriptions) {
    try {
      const userSubsRef = doc(db, 'userSubscriptions', userId);
      await setDoc(userSubsRef, {
        subscriptions,
        lastUpdated: new Date().toISOString(),
        totalCount: subscriptions.length
      });
    } catch (error) {
      console.error('Error caching subscriptions to Firestore:', error);
    }
  }

  /**
   * Get cached subscriptions from Firestore
   */
  async getCachedSubscriptions(userId) {
    try {
      const userSubsRef = doc(db, 'userSubscriptions', userId);
      const subsDoc = await getDoc(userSubsRef);
      
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
   * Fetch latest videos from a specific channel
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

      // First get the channel's upload playlist ID
      const channelUrl = `${this.baseURL}/channels?` + new URLSearchParams({
        part: 'contentDetails',
        id: channelId,
        access_token: accessToken
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
        order: 'date',
        access_token: accessToken
      });

      const videosResponse = await fetch(videosUrl);
      const videosData = await videosResponse.json();

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

  /**
   * Check if user has YouTube access
   */
  async hasYouTubeAccess(userId) {
    const token = await this.getUserAccessToken(userId);
    return !!token;
  }

  /**
   * Get user subscriptions with fallback to cache
   */
  async getUserSubscriptions(userId, forceRefresh = false) {
    try {
      // Try to get fresh data if user has access token
      const accessToken = await this.getUserAccessToken(userId);
      
      if (accessToken && forceRefresh) {
        const subscriptions = await this.fetchUserSubscriptions(accessToken);
        await this.cacheSubscriptionsToFirestore(userId, subscriptions);
        return subscriptions;
      }
      
      // Fall back to cached data
      const cached = await this.getCachedSubscriptions(userId);
      if (cached) {
        return cached.subscriptions;
      }
      
      // If no cached data and no access token, request access
      if (!accessToken) {
        return null; // Indicates need to request YouTube access
      }
      
      // Fetch fresh data
      const subscriptions = await this.fetchUserSubscriptions(accessToken);
      await this.cacheSubscriptionsToFirestore(userId, subscriptions);
      return subscriptions;
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      
      // Try to return cached data as fallback
      const cached = await this.getCachedSubscriptions(userId);
      if (cached) {
        return cached.subscriptions;
      }
      
      throw error;
    }
  }
}

// Export singleton instance
export const youtubeSubscriptionsService = new YouTubeSubscriptionsService();
export default youtubeSubscriptionsService;