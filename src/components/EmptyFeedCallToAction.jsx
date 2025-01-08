import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SearchPopover from "./SearchPopover";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { fetchChannelDetails } from "../services/youtubeApi";

const EmptyFeedCallToAction = () => {
  const { user } = useAuth();
  const { feedName } = useParams();
  const [isHovered, setIsHovered] = useState(false);
  const [feedChannels, setFeedChannels] = useState({});
  const [channelDetails, setChannelDetails] = useState({});
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [hasChannels, setHasChannels] = useState(false);
  const [error, setError] = useState(null);

  const loadChannelDetails = async () => {
    try {
      const details = {};
      for (const channelId of Object.keys(feedChannels)) {
        const channelDetail = await fetchChannelDetails(channelId);
        details[channelId] = channelDetail;
      }
      setChannelDetails(details);
      return details;
    } catch (error) {
      console.error("Error loading channel details:", error);
      setError("Failed to load channel details");
    }
  };

  const loadFeedData = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const currentFeed = userData.feeds.find(feed => feed.name === feedName);
        
        if (currentFeed && currentFeed.channels) {
          const channels = {};
          currentFeed.channels.forEach(channel => {
            channels[channel.channelId] = channel.channelTitle;
          });
          setFeedChannels(channels);
          setHasChannels(true);
          await loadChannelDetails();
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading feed data:", error);
      setError("Failed to load feed data");
      setIsLoading(false);
    }
  };

  const handleChannelAdded = async () => {
    setIsLoading(true);
    setVideos([]);
    try {
      await loadFeedData();
      setHasChannels(true);
    } catch (error) {
      console.error("Error handling channel addition:", error);
      setError("Failed to update channel list");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl  mx-auto rounded-md text-center">
      <div className="mb-8">
        <svg
          className="w-48 h-48 mx-auto text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      <h2 className="text-3xl font-medium  tracking-tight text-white mb-4">
        Your feed is empty, add Channels
      </h2>
      
      <p className="text-white/75 text-xl/7 max-w-md mx-auto mb-8">
        Start adding your favorite YouTube channels to create your personalized
        ZenFeed.
      </p>
      
      <button
        className={`rounded-md bg-white px-6 py-4 text-lg/4 font-medium text-gray-950 md:w-1/2 text-center drop-shadow-md transition duration-300 ease-in-out transform ${
          isHovered ? "scale-105" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsSearchPopoverOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? "Adding Channel..." : "Add Your First Channel"}
      </button>

      <SearchPopover
        isOpen={isSearchPopoverOpen}
        onClose={() => setIsSearchPopoverOpen(false)}
        onChannelAdded={handleChannelAdded}
        setIsLoading={setIsLoading}
        setVideos={setVideos}
        setHasChannels={setHasChannels}
        loadChannelDetails={loadChannelDetails}
        feedName={feedName}
      />
    </div>
  );
};

export default EmptyFeedCallToAction;