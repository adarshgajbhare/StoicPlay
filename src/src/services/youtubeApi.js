const API_KEY = 'AIzaSyBw7B1moKVjKgh5dYDOD5bj8D1SCc5WEW0'; // Replace with your API key
//const API_KEY = 'AIzaSyDvMTlhlNUZNfys0p0NEWfekINSS1EjsqM'; // Replace with your API key

export const searchChannels = async (searchQuery) => {
  const maxResults = 10;
  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=${maxResults}&q=${searchQuery}&key=${API_KEY}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error searching channels');
  }
  const data = await response.json();
  return data.items;
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
  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error fetching channel details');
  }
  const data = await response.json();
  return data.items[0] ? data.items[0].snippet : null;
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