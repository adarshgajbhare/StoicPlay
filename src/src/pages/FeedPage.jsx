import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ChannelCard from '../components/ChannelCard';
import VideoCard from '../components/VideoCard';
import {
  searchChannels as fetchChannelSearch,
  fetchChannelVideos,
  fetchChannelDetails,
} from '../services/youtubeApi';

function FeedPage() {
  const { feedName } = useParams();
  const [videos, setVideos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentFeed = localStorage.getItem('currentFeed');
    if (!currentFeed || currentFeed !== feedName) {
      localStorage.setItem('currentFeed', feedName);
    }
    loadFeedVideos();
  }, [feedName]);

  const loadFeedVideos = async () => {
    setIsLoading(true);
    let feedChannels = JSON.parse(localStorage.getItem(feedName) || '{}');
    let allVideos = [];

    for (const channelId in feedChannels) {
      const channelVideos = await fetchChannelVideos(channelId);
      allVideos = allVideos.concat(channelVideos);
    }

    allVideos.sort(
      (a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
    );

    for (const video of allVideos) {
      const channelDetails = await fetchChannelDetails(video.snippet.channelId);
      video.channelDetails = channelDetails;
    }

    setVideos(allVideos);
    setIsLoading(false);
  };

  const searchChannels = async (query) => {
    try {
      const response = await fetchChannelSearch(query);
      setSearchResults(response);
    } catch (error) {
      console.error('Error searching channels:', error);
    }
  };

  const addChannelToFeed = (channelId, channelTitle) => {
    let feedChannels = JSON.parse(localStorage.getItem(feedName) || '{}');
    if (!feedChannels[channelId]) {
      feedChannels[channelId] = channelTitle;
      localStorage.setItem(feedName, JSON.stringify(feedChannels));
      setSearchResults([]); // Clear search results
      loadFeedVideos(); // Reload videos
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          {feedName}
        </h1>
        <div className="mb-8">
          <SearchBar onSearch={searchChannels} />
        </div>

        {searchResults.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((channel) => (
                <ChannelCard
                  key={channel.id.channelId}
                  channel={channel}
                  onAddChannel={addChannelToFeed}
                />
              ))}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">Latest Videos</h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedPage;

