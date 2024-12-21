import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ChannelCard from '../components/ChannelCard';
import VideoCard from '../components/VideoCard';
import {
  searchChannels as fetchChannelSearch,
  fetchChannelVideos,
  fetchChannelDetails,
} from '../services/youtubeApi';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';

function FeedPage() {
  const { user } = useAuth();
  const { feedName } = useParams();
  const [videos, setVideos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedChannels, setFeedChannels] = useState({});
  const [channelDetails, setChannelDetails] = useState({});

  useEffect(() => {
    const loadFeedData = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const currentFeed = userData.feeds.find(feed => feed.name === feedName);
          if (currentFeed) {
            setFeedChannels(
              currentFeed.channels.reduce((acc, channel) => {
                acc[channel.channelId] = channel.channelTitle;
                return acc;
              }, {})
            );
          } else {
            setFeedChannels({});
          }
        } else {
          console.log("No such document!");
          setFeedChannels({});
        }
      }
    };
    loadFeedData();
  }, [feedName, user]);

  useEffect(() => {
    if (Object.keys(feedChannels).length > 0) {
      loadChannelDetails();
    }
  }, [feedChannels]);

  const loadChannelDetails = async () => {
    const details = {};
    for (const channelId of Object.keys(feedChannels)) {
      try {
        const channelDetail = await fetchChannelDetails(channelId);
        details[channelId] = channelDetail;
      } catch (error) {
        console.error(`Error fetching details for channel ${channelId}:`, error);
      }
    }
    setChannelDetails(details);
    loadFeedVideos(details);
  };

  const loadFeedVideos = async (channelDetailsMap) => {
    setIsLoading(true);
    try {
      let allVideos = [];

      for (const channelId in feedChannels) {
        try {
          const channelVideos = await fetchChannelVideos(channelId);
          if (Array.isArray(channelVideos)) {
            const videosWithChannel = channelVideos.map(video => ({
              ...video,
              channelDetails: channelDetailsMap[channelId]
            }));
            allVideos = allVideos.concat(videosWithChannel);
          }
        } catch (error) {
          console.error(`Error fetching videos for channel ${channelId}:`, error);
        }
      }

      allVideos.sort((a, b) =>
        new Date(b.snippet?.publishedAt || 0) - new Date(a.snippet?.publishedAt || 0)
      );

      setVideos(allVideos);
    } catch (error) {
      console.error('Error loading feed videos:', error);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchChannels = async (query) => {
    try {
      const response = await fetchChannelSearch(query);
      setSearchResults(response);
    } catch (error) {
      console.error('Error searching channels:', error);
    }
  };

  const addChannelToFeed = async (channelId, channelTitle) => {
    if (user) {
      try {
        const channelDetail = await fetchChannelDetails(channelId);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const updatedFeeds = userDocSnap.data().feeds.map(feed => {
            if (feed.name === feedName) {
              return {
                ...feed,
                channels: [...(feed.channels || []), { channelId, channelTitle }]
              };
            }
            return feed;
          });

          await updateDoc(userDocRef, { feeds: updatedFeeds });
        } else {
          // If the document doesn't exist, create it with the initial channel
          await setDoc(userDocRef, {
            feeds: [{
              name: feedName,
              channels: [{ channelId, channelTitle }]
            }]
          });
        }

        // Update local state
        setFeedChannels(prev => ({ ...prev, [channelId]: channelTitle }));
        setChannelDetails(prev => ({ ...prev, [channelId]: channelDetail }));
        setSearchResults([]);

      } catch (error) {
        console.error('Error adding channel:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="text-white hover:text-pink-300 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
            {feedName}
          </h1>
          <div className="w-6"></div>
        </div>
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
              <VideoCard
                key={video.id?.videoId || video.id}
                video={video}
                channelDetails={video.channelDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedPage;