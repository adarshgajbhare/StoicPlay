import React from 'react';
import { CheckCircle, UserPlus } from 'lucide-react';

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
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl">
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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-base text-white truncate max-w-[200px]">
                  {channel.snippet.title || 'Untitled Channel'}
                </h3>
                {isVerified() && (
                  <CheckCircle className="text-gray-400 w-4 h-4 flex-shrink-0" />
                )}
              </div>
              {channel.statistics && (
                <p className="text-sm text-gray-400">
                  {formatSubscriberCount(channel.statistics.subscriberCount)} subscribers
                </p>
              )}
            </div>
            <button
              onClick={handleAddChannel}
              className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-full text-sm flex items-center gap-2 flex-shrink-0 transition-colors duration-200"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          <p className="text-sm text-gray-400 line-clamp-1">
            {channel.snippet.description || 'No description available'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChannelCard;