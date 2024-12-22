/* eslint-disable react/prop-types */
import { useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import SearchBar from "./SearchBar";
import ChannelCard from "./ChannelCard";
import {
  searchChannels as fetchChannelSearch,
  fetchChannelDetails,
} from "../services/youtubeApi";

function SearchPopover({ isOpen, onClose, onChannelAdded }) {
  const { user } = useAuth();
  const { feedName } = useParams();

  const [searchResults, setSearchResults] = useState([]);
  const [feedChannels, setFeedChannels] = useState({});
  const [channelDetails, setChannelDetails] = useState({});

  const searchChannels = async (query) => {
    try {
      const response = await fetchChannelSearch(query);
      setSearchResults(response);
    } catch (error) {
      console.error("Error searching channels:", error);
    }
  };

  const addChannelToFeed = async (channelId, channelTitle) => {
    if (user) {
      try {
        const channelDetail = await fetchChannelDetails(channelId);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const updatedFeeds = userDocSnap.data().feeds.map((feed) => {
            if (feed.name === feedName) {
              return {
                ...feed,
                channels: [
                  ...(feed.channels || []),
                  { channelId, channelTitle },
                ],
              };
            }
            return feed;
          });
          await updateDoc(userDocRef, { feeds: updatedFeeds });
        } else {
          await setDoc(userDocRef, {
            feeds: [
              {
                name: feedName,
                channels: [{ channelId, channelTitle }],
              },
            ],
          });
        }

        setFeedChannels((prev) => ({ ...prev, [channelId]: channelTitle }));
        setChannelDetails((prev) => ({ ...prev, [channelId]: channelDetail }));
        setSearchResults([]);

        if (onChannelAdded) {
          onChannelAdded();
        }
      } catch (error) {
        console.error("Error adding channel:", error);
      }
    }
  };

  return (
    isOpen && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-black overflow-y-scroll h-4/5 p-6 rounded-lg shadow-lg w-full max-w-6xl relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-300"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <SearchBar onSearch={searchChannels} />
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Search Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
      </motion.div>
    )
  );
}

export default SearchPopover;