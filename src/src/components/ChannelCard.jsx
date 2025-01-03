/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { CheckCircle, UserPlus } from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";

function ChannelCard({ channel, onAddChannel }) {
  const [isAdded, setIsAdded] = useState(false);

  if (!channel || !channel.snippet) {
    return null;
  }

  const handleAddChannel = () => {
    onAddChannel(
      channel.id.channelId,
      channel.snippet.title,
      channel.statistics
    );
    setIsAdded(true);
  };

  function formatSubscriberCount(count) {
    if (!count) return "0";
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  }

  // New function to check if channel should show verification badge
  const isVerified = () => {
    return channel.statistics?.subscriberCount >= 100000;
  };

  return (
    <div className="bg-[#202020]  rounded  overflow-hidden shadow-lg">
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0">
          <img
            src={channel.snippet.thumbnails?.default?.url || "/placeholder.svg"}
            alt={channel.snippet.title || "Channel thumbnail"}
            className="size-10 md:size-14 rounded-full  object-cover"
          />
        </div>
        <div className="flex-grow min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center">
                <h3 className="font-medium  text-base/4 md:text-xl/4 truncate">
                  {channel.snippet.title}
                </h3>
                {isVerified() && (
                  <FaCheckCircle className="text-lime-500 relative ml-2 size-4" />
                )}
              </div>
              {channel.statistics && (
                <p className="md:text-sm/3 text-xs/3 mt-2 bg-red-700  rounded-sm w-fit p-1 mb-  text-white">
                  {formatSubscriberCount(channel.statistics.subscriberCount)}{" "}
                  subscribers
                </p>
              )}
            </div>
            <button
              onClick={handleAddChannel}
              className={`w-fit flex-shrink-0 py-3 px-4 rounded  font-medium tracking-tight text-base/3 ${
                isAdded
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-white text-black hover:bg-blue-600   hover:text-white"
              }`}
              disabled={isAdded}
            >
              {isAdded ? "Added" : "Add"}
            </button>
          </div>
          <p className="md:text-sm/4 w-3/4  text-sm text-left  text-gray-300  text-balance line-clamp-3">
            {channel.snippet.description || "No description available"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChannelCard;
