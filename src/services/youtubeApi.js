import { config } from '../config/config.js';

export const searchChannels = async (searchQuery) => {
  const maxResults = 10;
  const apiUrl = `${config.youtube.baseUrl}/search?part=snippet&type=channel&maxResults=${maxResults}&q=${encodeURIComponent(searchQuery)}&key=${config.youtube.apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error searching channels: ${response.status} ${
          errorData.error?.message || ''
        }`
      );
    }
    const data = await response.json();
    const channelIds = data.items
      .map((item) => item.id.channelId)
      .join(',');

    const statsApiUrl = `${config.youtube.baseUrl}/channels?part=statistics&id=${channelIds}&key=${config.youtube.apiKey}`;
    const statsResponse = await fetch(statsApiUrl);
    if (!statsResponse.ok) {
      const errorData = await statsResponse.json();
      throw new Error(
        `Error fetching channel statistics: ${statsResponse.status} ${
          errorData.error?.message || ''
        }`
      );
    }
    const statsData = await statsResponse.json();

    return data.items.map((item) => {
      const statsItem = statsData.items.find(
        (stats) => stats.id === item.id.channelId
      );
      const isVerified = item.snippet.badges
        ? item.snippet.badges.includes('VERIFIED')
        : false;
      const profileImageUrl =
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url ||
        '/default-profile.jpg';

      return {
        ...item,
        statistics: statsItem ? statsItem.statistics : null,
        isVerified,
        profileImageUrl,
      };
    });
  } catch (error) {
    console.error('Error in searchChannels:', error);
    throw error; // Re-throw the error for the caller to handle
  }
};

export const fetchChannelUploadsPlaylistId = async (channelId) => {
  const apiUrl = `${config.youtube.baseUrl}/channels?part=contentDetails&id=${channelId}&key=${config.youtube.apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error fetching channel uploads playlist ID: ${response.status} ${
          errorData.error?.message || ''
        }`
      );
    }
    const data = await response.json();
    return data.items[0].contentDetails.relatedPlaylists.uploads;
  } catch (error) {
    console.error('Error in fetchChannelUploadsPlaylistId:', error);
    throw error;
  }
};

// Updated function to support pagination and ensure we get at least one video
export const fetchVideosForChannel = async (uploadsPlaylistId, pageToken = null, maxResults = 5) => {
  let apiUrl = `${config.youtube.baseUrl}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${config.youtube.apiKey}`;
  
  if (pageToken) {
    apiUrl += `&pageToken=${pageToken}`;
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error fetching videos for channel: ${response.status} ${
          errorData.error?.message || ''
        }`
      );
    }
    const data = await response.json();
    
    // If no items, return empty result
    if (!data.items || data.items.length === 0) {
      return {
        videos: [],
        nextPageToken: null,
        hasMore: false
      };
    }
    
    const videoIds = data.items
      .map((item) => item.snippet.resourceId.videoId)
      .join(',');

    const detailsApiUrl = `${config.youtube.baseUrl}/videos?part=contentDetails&id=${videoIds}&key=${config.youtube.apiKey}`;
    const detailsResponse = await fetch(detailsApiUrl);
    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json();
      throw new Error(
        `Error fetching video details: ${detailsResponse.status} ${
          errorData.error?.message || ''
        }`
      );
    }
    const detailsData = await detailsResponse.json();

    // First, try to find videos longer than 60 seconds
    let filteredVideos = data.items.filter((item) => {
      const videoDetails = detailsData.items.find(
        (detail) => detail.id === item.snippet.resourceId.videoId
      );
      if (!videoDetails?.contentDetails) return false;

      const duration = videoDetails.contentDetails.duration;
      const durationInSeconds = parseDuration(duration);

      return durationInSeconds >= 60;
    });

    // If no videos >= 60 seconds and this is the initial load (maxResults <= 5), include all videos
    if (filteredVideos.length === 0 && maxResults <= 5) {
      console.log('No videos >= 60 seconds found, including all videos for initial load');
      filteredVideos = data.items.filter((item) => {
        const videoDetails = detailsData.items.find(
          (detail) => detail.id === item.snippet.resourceId.videoId
        );
        return !!videoDetails?.contentDetails;
      });
    }

    return {
      videos: filteredVideos,
      nextPageToken: data.nextPageToken || null,
      hasMore: !!data.nextPageToken
    };
  } catch (error) {
    console.error('Error in fetchVideosForChannel:', error);
    throw error;
  }
};

const parseDuration = (duration) => {
  if (!duration) {
    console.warn('Duration is null or undefined');
    return 0;
  }
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) {
    console.warn(`Invalid duration format: ${duration}`);
    return 0;
  }
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

export const fetchChannelDetails = async (channelId) => {
  const apiUrl = `${config.youtube.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${config.youtube.apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error fetching channel details: ${response.status} ${
          errorData.error?.message || ''
        }`
      );
    }
    const data = await response.json();
    return data.items[0]
      ? {
          snippet: data.items[0].snippet,
          statistics: data.items[0].statistics,
        }
      : null;
  } catch (error) {
    console.error('Error in fetchChannelDetails:', error);
    throw error;
  }
};

// Updated function to support pagination
export const fetchChannelVideos = async (channelId, pageToken = null, maxResults = 5) => {
  try {
    const uploadsPlaylistId = await fetchChannelUploadsPlaylistId(channelId);
    const result = await fetchVideosForChannel(uploadsPlaylistId, pageToken, maxResults);
    return result;
  } catch (error) {
    console.error('Error fetching videos for channel:', error);
    return {
      videos: [],
      nextPageToken: null,
      hasMore: false
    };
  }
};

// Utility function to format relative time
export function formatRelativeTime(publishedAt) {
  const now = new Date();
  const publishedDate = new Date(publishedAt);
  const seconds = Math.round((now - publishedDate) / 1000);

  if (seconds < 60) {
    return seconds + ' seconds ago';
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return minutes + ' minutes ago';
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return hours + ' hours ago';
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return days + ' days ago';
  }

  const weeks = Math.round(days / 7);
  if (weeks < 4) {
    return weeks + ' weeks ago';
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return months + ' months ago';
  }

  const years = Math.round(days / 365);
  return years + ' years ago';
}

// Utility function to get video thumbnail URL
export const getVideoThumbnailUrl = (thumbnails) => {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    '/placeholder.png'
  );
};

// Utility function to get channel thumbnail URL
export const getChannelThumbnailUrl = (thumbnails) => {
  return (
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    '/placeholder.png'
  );
};

// Function to fetch playlist details
export const fetchPlaylistDetails = async (playlistId) => {
  try {
    const response = await fetch(
      `${config.youtube.baseUrl}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${config.youtube.apiKey}`
    );
    const data = await response.json();

    if (!data.items?.length) {
      throw new Error('Playlist not found');
    }

    return data.items[0];
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
};

// Function to fetch videos from a playlist
export const fetchPlaylistVideos = async (playlistId) => {
  try {
    const response = await fetch(
      `${config.youtube.baseUrl}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${config.youtube.maxResults}&key=${config.youtube.apiKey}`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    throw error;
  }
};