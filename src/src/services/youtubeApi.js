import { config } from '../config/config.js';

export const searchChannels = async (searchQuery) => {
  const maxResults = 10;
  const apiUrl = `${config.youtube.baseUrl}/search?part=snippet&type=channel&maxResults=${maxResults}&q=${searchQuery}&key=${config.youtube.apiKey}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error searching channels');
  }
  const data = await response.json();
  const channelIds = data.items.map((item) => item.id.channelId).join(',');

  const statsApiUrl = `${config.youtube.baseUrl}/channels?part=statistics&id=${channelIds}&key=${config.youtube.apiKey}`;
  const statsResponse = await fetch(statsApiUrl);
  if (!statsResponse.ok) {
    throw new Error('Error fetching channel statistics');
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
};

export const fetchChannelUploadsPlaylistId = async (channelId) => {
  const apiUrl = `${config.youtube.baseUrl}/channels?part=contentDetails&id=${channelId}&key=${config.youtube.apiKey}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error fetching channel uploads playlist ID');
  }
  const data = await response.json();
  return data.items[0].contentDetails.relatedPlaylists.uploads;
};

export const fetchVideosForChannel = async (uploadsPlaylistId) => {
  const maxResults = 50;
  const apiUrl = `${config.youtube.baseUrl}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${config.youtube.apiKey}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error fetching videos for channel');
  }
  const data = await response.json();
  const videoIds = data.items.map((item) => item.snippet.resourceId.videoId).join(',');

  const detailsApiUrl = `${config.youtube.baseUrl}/videos?part=contentDetails&id=${videoIds}&key=${config.youtube.apiKey}`;
  const detailsResponse = await fetch(detailsApiUrl);
  if (!detailsResponse.ok) {
    throw new Error('Error fetching video details');
  }
  const detailsData = await detailsResponse.json();

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  return data.items.filter((item) => {
    const videoDetails = detailsData.items.find(
      (detail) => detail.id === item.snippet.resourceId.videoId
    );
    if (!videoDetails?.contentDetails) return false;

    const publishedDate = new Date(item.snippet.publishedAt);
    const duration = videoDetails.contentDetails.duration;
    const durationInSeconds = parseDuration(duration);

    return durationInSeconds >= 60 && publishedDate >= fifteenDaysAgo;
  });
};

const parseDuration = (duration) => {
  if (!duration) {
    console.warn("Duration is null or undefined");
    return 0;
  }
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) {
    console.warn(`Invalid duration format: ${duration}`);
    return 0;
  }
  const hours = (parseInt(match[1]) || 0) * 3600;
  const minutes = (parseInt(match[2]) || 0) * 60;
  const seconds = parseInt(match[3]) || 0;
  return hours + minutes + seconds;
};

export const fetchChannelDetails = async (channelId) => {
  const apiUrl = `${config.youtube.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${config.youtube.apiKey}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error fetching channel details');
  }
  const data = await response.json();
  return data.items[0]
    ? {
        snippet: data.items[0].snippet,
        statistics: data.items[0].statistics,
      }
    : null;
};

export const fetchChannelVideos = async (channelId) => {
  try {
    const uploadsPlaylistId = await fetchChannelUploadsPlaylistId(channelId);
    const videos = await fetchVideosForChannel(uploadsPlaylistId);
    return videos;
  } catch (error) {
    console.error('Error fetching videos for channel:', error);
    return [];
  }
};

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

export const getVideoThumbnailUrl = (thumbnails) => {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    "/placeholder.png"
  );
};

export const getChannelThumbnailUrl = (thumbnails) => {
  return (
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    "/placeholder.png"
  );
};

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