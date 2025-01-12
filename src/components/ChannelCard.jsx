import { IconCircleCheck } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useState } from "react";

function ChannelCard({ channel, onAddChannel }) {
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!channel || !channel?.snippet) return null;

  const handleAddChannel = () => {
    onAddChannel(channel?.id.channelId, channel?.snippet.title, channel?.statistics);
    setIsAdded(true);
  };

  const formatSubscriberCount = (count) => {
    if (!count) return "0";
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const isVerified = () => channel?.statistics?.subscriberCount >= 100000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      // whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-[#101010]  rounded-xl overflow-hidden "
    >
      <div className="p-4 flex items-start gap-4">
        <motion.img
          src={channel?.snippet.thumbnails?.default?.url || "/placeholder.svg"}
          alt={channel?.snippet.title}
          className="w-12 h-12 rounded-full object-cover"
          // whileHover={{ scale: 1.1 }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-medium text-white truncate">
                {channel?.snippet.title}
              </h3>
              {isVerified() && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <IconCircleCheck className="text-purple-500 w-4 h-4 flex-shrink-0" />
                </motion.div>
              )}
            </div>
            <motion.button
              onClick={handleAddChannel}
              disabled={isAdded}
              // whileHover={!isAdded ? { scale: 1.05 } : {}}
              whileTap={!isAdded ? { scale: 0.95 } : {}}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${isAdded 
                  ? "bg-gray-500 text-white/50 cursor-not-allowed" 
                  : "bg-white text-black hover:bg-gray-100"}`}
            >
              {isAdded ? "Added" : "Add"}
            </motion.button>
          </div>
          {/* <p className="text-white/40 text-sm mt-1">
            {channel?.snippet.customUrl || channel?.snippet.title.toLowerCase().replace(/\s+/g, '')}
          </p> */}
          {channel?.statistics && (
            <p className="text-sm text-left text-white/60">
              {formatSubscriberCount(channel?.statistics.subscriberCount)} subscribers
            </p>
          )}
          <motion.p 
            className="text-sm text-left text-white/60  line-clamp-2"
            animate={{ opacity: isHovered ? 1 : 0.6 }}
          >
            {channel?.snippet.description || "No description available"}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

export default ChannelCard;