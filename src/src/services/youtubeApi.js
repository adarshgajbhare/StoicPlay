export  const API_KEY = 'AIzaSyBw7B1moKVjKgh5dYDOD5bj8D1SCc5WEW0'; // Replace with your API key
// const API_KEY = 'AIzaSyDvMTlhlNUZNfys0p0NEWfekINSS1EjsqM'; // Replace with your API key

export const searchChannels = async (searchQuery) => {
  const maxResults = 10;
  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=${maxResults}&q=${searchQuery}&key=${API_KEY}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error searching channels');
  }
  const data = await response.json();
  const channelIds = data.items.map((item) => item.id.channelId).join(',');

  // Fetch statistics for the found channels
  const statsApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${API_KEY}`;
  const statsResponse = await fetch(statsApiUrl);
  if (!statsResponse.ok) {
    throw new Error('Error fetching channel statistics');
  }
  const statsData = await statsResponse.json();

  // Combine data and check for verification badge
  const combinedData = data.items.map((item) => {
    const statsItem = statsData.items.find(
      (stats) => stats.id === item.id.channelId
    );

    // Check if the channel has the "verified" badge in the snippet
    const isVerified = item.snippet.badges
      ? item.snippet.badges.includes('VERIFIED')
      : false;

    return {
      ...item,
      statistics: statsItem ? statsItem.statistics : null,
      isVerified: isVerified,
    };
  });

  return combinedData;
};


export const fetchChannelUploadsPlaylistId = async (channelId) => {
  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error fetching channel uploads playlist ID');
  }
  const data = await response.json();
  return data.items[0].contentDetails.relatedPlaylists.uploads;
};

export const fetchVideosForChannel = async (uploadsPlaylistId) => {
  const maxResults = 50;
  const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${API_KEY}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error fetching videos for channel');
  }
  const data = await response.json();
  return data.items;
};

export const fetchChannelDetails = async (channelId) => {
  // Fetch both snippet and statistics
  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;

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