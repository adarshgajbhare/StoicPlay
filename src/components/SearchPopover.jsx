import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { IconX, IconUsers, IconBriefcase, IconHash } from "@tabler/icons-react";

function SearchPopover({
  isOpen,
  onClose,
  onChannelAdded,
  setIsLoading,
  setVideos,
  setHasChannels,
  loadChannelDetails,
}) {
  const { user } = useAuth();
  const { feedName } = useParams();
  const [searchResults, setSearchResults] = useState([]);
  const [feedChannels, setFeedChannels] = useState({});
  const [channelDetails, setChannelDetails] = useState({});
  const [activeTab, setActiveTab] = useState("channels");

  const searchChannels = async (query) => {
    try {
      const response = await fetchChannelSearch(query);
      setSearchResults(response);
    } catch (error) {
      console.error("Error searching channels:", error);
    }
  };

  const addChannelToFeed = async (channelId, channelTitle) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const channelDetail = await fetchChannelDetails(channelId);
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const updatedFeeds = userDocSnap.data().feeds.map((feed) => {
          if (feed.name === feedName) {
            return {
              ...feed,
              channels: [...(feed.channels || []), { channelId, channelTitle }],
            };
          }
          return feed;
        });
        await updateDoc(userDocRef, { feeds: updatedFeeds });
      } else {
        await setDoc(userDocRef, {
          feeds: [{ name: feedName, channels: [{ channelId, channelTitle }] }],
        });
      }

      setFeedChannels((prev) => ({ ...prev, [channelId]: channelTitle }));
      setChannelDetails((prev) => ({ ...prev, [channelId]: channelDetail }));
      setSearchResults([]);
      setHasChannels(true);
      setVideos([]);

      if (onChannelAdded) onChannelAdded();
      await loadChannelDetails();
      onClose();
    } catch (error) {
      console.error("Error adding channel:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    // { id: "channels", icon: IconUsers, label: "Channels" },
    // { id: "tags", icon: IconHash, label: "Tags" },
    // { id: "other", icon: IconBriefcase, label: "Other" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-[#202020] rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <SearchBar onSearch={searchChannels} />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <IconX size={20} className="text-white" />
                </motion.button>
              </div>

              {searchResults.length > 0 && (
                <>
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-semibold text-white">
                      Top Results
                    </h2>
                    <div className="flex gap-2 ml-auto">
                      {tabs.map((tab) => (
                        <motion.button
                          key={tab.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm
                            ${
                              activeTab === tab.id
                                ? "bg-purple-600 text-white"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                            }`}
                        >
                          <tab.icon size={16} />
                          <span>{tab.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-y-auto  popover  max-h-[60vh] pr-2 -mr-2">
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.map((channel) => (
                        <ChannelCard
                          key={channel.id.channelId}
                          channel={channel}
                          onAddChannel={addChannelToFeed}
                        />
                      ))}
                    </motion.div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SearchPopover;
