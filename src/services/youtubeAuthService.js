import { auth, youtubeProvider } from '../lib/firebase';
import { linkWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

class YouTubeAuthService {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Request YouTube OAuth consent using linkWithPopup (no re-authentication needed)
   */
  async requestYouTubeAccess() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User must be logged in');

      // Use linkWithPopup to add YouTube scope to existing account
      const result = await linkWithPopup(user, youtubeProvider);
      const credential = result._tokenResponse;
      
      if (!credential.oauthAccessToken) {
        throw new Error('Failed to get YouTube access token');
      }

      // Store the access token in Firestore
      await this.storeUserTokens(user.uid, {
        accessToken: credential.oauthAccessToken,
        refreshToken: credential.oauthRefreshToken || null,
        expiresAt: Date.now() + ((credential.oauthExpiresIn || 3600) * 1000),
        scope: 'youtube',
        grantedAt: new Date().toISOString()
      });

      return credential.oauthAccessToken;
    } catch (error) {
      // If linking fails because provider is already linked, try direct popup
      if (error.code === 'auth/provider-already-linked' || error.code === 'auth/credential-already-in-use') {
        return this.requestYouTubeAccessDirect();
      }
      console.error('Error requesting YouTube access:', error);
      throw error;
    }
  }

  /**
   * Direct YouTube access request (fallback method)
   */
  async requestYouTubeAccessDirect() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User must be logged in');

      // Create a popup window for YouTube OAuth
      const clientId = import.meta.env.VITE_FIREBASE_API_KEY; // We'll use a different approach
      const redirectUri = window.location.origin;
      const scope = 'https://www.googleapis.com/auth/youtube.readonly';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: '1042148447493-9gcvkmla4fdvsom0ed5j8ekjvg4bj5f8.apps.googleusercontent.com', // Firebase client ID
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: scope,
        state: user.uid
      });

      return new Promise((resolve, reject) => {
        const popup = window.open(authUrl, 'youtube-auth', 'width=500,height=600');
        
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authorization cancelled'));
          }
        }, 1000);

        // Listen for the redirect
        const messageListener = (event) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'YOUTUBE_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageListener);
            
            const accessToken = event.data.accessToken;
            const expiresIn = event.data.expiresIn || 3600;
            
            // Store token
            this.storeUserTokens(user.uid, {
              accessToken,
              refreshToken: null,
              expiresAt: Date.now() + (expiresIn * 1000),
              scope: 'youtube',
              grantedAt: new Date().toISOString()
            }).then(() => {
              resolve(accessToken);
            }).catch(reject);
          } else if (event.data.type === 'YOUTUBE_AUTH_ERROR') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageListener);
            reject(new Error(event.data.error));
          }
        };

        window.addEventListener('message', messageListener);
      });
    } catch (error) {
      console.error('Error with direct YouTube access:', error);
      throw error;
    }
  }

  /**
   * Store user OAuth tokens securely in Firestore
   */
  async storeUserTokens(userId, tokenData) {
    try {
      const userTokenRef = doc(db, 'userTokens', userId);
      
      const cleanTokenData = {
        accessToken: tokenData.accessToken || null,
        refreshToken: tokenData.refreshToken || null,
        expiresAt: tokenData.expiresAt || (Date.now() + 3600000),
        scope: tokenData.scope || 'youtube',
        grantedAt: tokenData.grantedAt || new Date().toISOString()
      };
      
      await setDoc(userTokenRef, {
        youtube: cleanTokenData,
        updatedAt: new Date().toISOString(),
        userId: userId // Add for security rules
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

      const data = tokenDoc.data();
      const tokenData = data?.youtube;
      
      if (tokenData && tokenData.accessToken && tokenData.expiresAt > Date.now()) {
        return tokenData.accessToken;
      }

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
        totalCount: subscriptions.length,
        userId: userId
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
      const accessToken = await this.getUserAccessToken(userId);
      
      if (accessToken && forceRefresh) {
        const subscriptions = await this.fetchUserSubscriptions(accessToken);
        await this.cacheSubscriptionsToFirestore(userId, subscriptions);
        return subscriptions;
      }
      
      const cached = await this.getCachedSubscriptions(userId);
      if (cached) {
        return cached.subscriptions;
      }
      
      if (!accessToken) {
        return null;
      }
      
      const subscriptions = await this.fetchUserSubscriptions(accessToken);
      await this.cacheSubscriptionsToFirestore(userId, subscriptions);
      return subscriptions;
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      
      const cached = await this.getCachedSubscriptions(userId);
      if (cached) {
        return cached.subscriptions;
      }
      
      throw error;
    }
  }

  /**
   * Fetch latest videos from a specific channel
   */
  async fetchChannelVideos(channelId, accessToken, maxResults = 20) {
    try {
      const cacheKey = `channel_videos_${channelId}`;
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

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

export const youtubeAuthService = new YouTubeAuthService();
export default youtubeAuthService;