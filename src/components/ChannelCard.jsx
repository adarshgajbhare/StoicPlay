/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { CheckCircle, UserPlus } from 'lucide-react';
import { FaCheckCircle } from 'react-icons/fa';

function ChannelCard({ channel, onAddChannel }) {

  const [isAdded, setIsAdded] = useState(false);

  if (!channel || !channel.snippet) {
    return null;
  }

  const handleAddChannel = () => {
    onAddChannel(channel.id.channelId, channel.snippet.title, channel.statistics);
    setIsAdded(true);
  };


  function formatSubscriberCount(count) {
    if (!count) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  // New function to check if channel should show verification badge
  const isVerified = () => {
    return channel.statistics?.subscriberCount >= 100000;
  };
    
  return (
    <div className="bg-black ring-[1px] ring-white/20 rounded-md overflow-hidden shadow-lg">
      <div className="p-6 flex items-start gap-6">
        <div className="flex-shrink-0">
          <img
            src={channel.snippet.thumbnails?.default?.url || '/placeholder.svg'}
            alt={channel.snippet.title || 'Channel thumbnail'}
            className="size-10 md:size-16 rounded-md object-cover"
          />
        </div>
        <div className="flex-grow min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
            <div className="flex items-center">
          <h3 className="font-semibold text-base/4 md:text-xl/4 truncate text-white">
            {channel.snippet.title}
          </h3>
          {isVerified() && (
            <FaCheckCircle className="text-lime-500 relative ml-2 size-4" />
          )}
        </div>
              {channel.statistics && (
                <p className="md:text-sm/3 text-xs mt-2 bg-red-600  rounded-sm w-fit p-1 mb-2 font-medium text-white">
                  {formatSubscriberCount(channel.statistics.subscriberCount)} subscribers
                </p>
              )}
            </div>
            <button
      onClick={handleAddChannel}
      className={`w-fit flex-shrink-0 py-3 px-4 rounded-md font-medium tracking-tight text-base/3 ${
        isAdded
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-white text-black hover:bg-green-500 hover:text-white"
      }`}
      disabled={isAdded}
    >
      {isAdded ? "Added" : "Add"}
    </button>
          </div>
          <p className="md:text-base/5 text-sm text-white/60 mb-4 text-pretty line-clamp-3">
            {channel.snippet.description || 'No description available'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChannelCard;
