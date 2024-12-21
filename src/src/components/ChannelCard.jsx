import React from 'react';
import { FaCheckCircle } from 'react-icons/fa'; 
import { formatRelativeTime } from '../services/youtubeApi';
function ChannelCard({ channel, onAddChannel }) {
  const handleAddChannel = () => {
    onAddChannel(
      channel.id.channelId,
      channel.snippet.title,
      channel.statistics,
      channel.isVerified
    );
  };
  function formatSubscriberCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return count.toString();
    }
  }
    
  return (
    <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
      <img
        src={channel.snippet.thumbnails.medium.url}
        alt={channel.snippet.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
      <div className="flex items-center">
         
          <h3 className="font-semibold text-lg mb-2 truncate">
            {channel.snippet.title}
          </h3>
          {!channel.isVerified && (
            <FaCheckCircle className="text-blue-700 ml-2 size-3" />
          )}


        </div>
        {
  channel.statistics && (
    <p className="text-sm text-black">
     {formatSubscriberCount(channel.statistics.subscriberCount)} Subscribers
    </p>
  )
}


        <p className="text-sm text-gray-300 mb-4 line-clamp-2">
          {channel.snippet.description}
        </p>
       
        <button
          onClick={handleAddChannel}
          className="w-full bg-pink-500 text-white py-2 px-4 rounded-full hover:bg-pink-600 transition-colors duration-200"
        >
          Add to Feed
        </button>
      </div>
    </div>
  );
}

export default ChannelCard;