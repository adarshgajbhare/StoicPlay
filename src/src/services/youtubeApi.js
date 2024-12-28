
//API Keys 
export  const API_KEY = 'AIzaSyBw7B1moKVjKgh5dYDOD5bj8D1SCc5WEW0'; 
//const API_KEY = 'AIzaSyDvMTlhlNUZNfys0p0NEWfekINSS1EjsqM'; 


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

    // Get the profile image URL, handling different cases
    const profileImageUrl =
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url ||
      '/default-profile.jpg'; // Provide a default image path here

    return {
      ...item,
      statistics: statsItem ? statsItem.statistics : null,
      isVerified: isVerified,
      profileImageUrl: profileImageUrl,
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
  const videoIds = data.items.map((item) => item.snippet.resourceId.videoId).join(',');

  // Fetch video details to get the duration
  const detailsApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`;
  const detailsResponse = await fetch(detailsApiUrl);
  if (!detailsResponse.ok) {
    throw new Error('Error fetching video details');
  }
  const detailsData = await detailsResponse.json();

  // Filter out videos with duration less than 60 seconds (YouTube Shorts)
  const filteredVideos = data.items.filter((item) => {
    const videoDetails = detailsData.items.find((detail) => detail.id === item.snippet.resourceId.videoId);

    // Check if videoDetails or contentDetails is undefined
    if (!videoDetails || !videoDetails.contentDetails) {
      console.warn(`Missing details for video ID: ${item.snippet.resourceId.videoId}`);
      return false; // Exclude videos without details
    }

    const duration = videoDetails.contentDetails.duration;

    // Log for debugging
  //  console.log(`Video ID: ${item.snippet.resourceId.videoId}, Duration: ${duration}`);

    const durationInSeconds = parseDuration(duration);
    return durationInSeconds >= 60;
  });

  return filteredVideos;
};

// Helper function to parse ISO 8601 duration to seconds
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


 // Function to get the best available thumbnail for videos
 export const getVideoThumbnailUrl = (thumbnails) => {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    "/placeholder.png" // Your default placeholder image
  );
};

// Function to get the best available thumbnail for channels
export const getChannelThumbnailUrl = (thumbnails) => {
  return (
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    "/placeholder.png" // Your default placeholder image
  );
};

