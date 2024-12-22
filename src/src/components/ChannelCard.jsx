/* eslint-disable react/prop-types */
import React from 'react';
import { CheckCircle, UserPlus } from 'lucide-react';
import { FaCheckCircle } from 'react-icons/fa';

function ChannelCard({ channel, onAddChannel }) {
  if (!channel || !channel.snippet) {
    return null;
  }

  const handleAddChannel = () => {
    onAddChannel(
      channel.id.channelId,
      channel.snippet.title,
      channel.statistics,
    );
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
            className="w-14 h-14 rounded-full object-cover"
          />
        </div>
        <div className="flex-grow min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
            <div className="flex items-center">
          <h3 className="font-semibold text-xl/4  truncate">
            {channel.snippet.title}
          </h3>
          {isVerified() && (
            <FaCheckCircle className="text-lime-500 relative ml-2 size-4" />
          )}
        </div>
              {channel.statistics && (
                <p className="text-sm/3 mt-2 bg-red-600  rounded-sm w-fit p-1 mb-2 font-medium text-white">
                  {formatSubscriberCount(channel.statistics.subscriberCount)} subscribers
                </p>
              )}
            </div>
            <button
          onClick={handleAddChannel}
          className="bg-white w-fit  hover:bg-green-500 hover:text-white    text-black font-medium tracking-tight text-base/3 py-3 px-4 rounded-md"
        >
          Add
        </button>
          </div>
          <p className="text-base/5 text-white/60 mb-4 text-pretty line-clamp-3">
            {channel.snippet.description || 'No description available'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChannelCard;