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
import { IconX } from "@tabler/icons-react";

function SearchPopover({
  isOpen,
  onClose,
  onChannelAdded,
  setIsLoading, // Receive setIsLoading from props
  setVideos,
  setHasChannels,
  loadChannelDetails,
}) {
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
        setIsLoading(true); // Now you can use setIsLoading
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
        setHasChannels(true);
        setVideos([]); // Clear existing videos before loading new ones

        if (onChannelAdded) {
          onChannelAdded();
        }

        // Load new channel details
        await loadChannelDetails();
        onClose();
      } catch (error) {
        console.error("Error adding channel:", error);
      } finally {
        setIsLoading(false); // Set loading to false after operation
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
        className="fixed inset-0 bg-black/50 filter backdrop-blur-lg flex items-center justify-center z-50"
      >
        <div className="popover overflow-y-scroll h-4/5 bg-[#202020] p-4 rounded-md shadow-lg w-full max-w-4xl relative">
          <div className="flex items-center gap-4">
            <div className="grow">
              <SearchBar onSearch={searchChannels} />
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-3 text-base/4 font-medium bg-[#101010] text-white ring-[1px] ring-white/20 w-fit text-center drop-shadow-md ml-auto"
              aria-label="Close search"
            >
              <IconX size={20} strokeWidth={2} color="white" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-medium  mb-4 text-white">Search Results</h2>
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
