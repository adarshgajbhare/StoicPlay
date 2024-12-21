import React from 'react';

function ChannelCard({ channel, onAddChannel }) {
  const handleAddChannel = () => {
    onAddChannel(channel.id.channelId, channel.snippet.title);
  };

  return (
    <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
      <img
        src={channel.snippet.thumbnails.medium.url}
        alt={channel.snippet.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">{channel.snippet.title}</h3>
        <p className="text-sm text-gray-300 mb-4 line-clamp-2">{channel.snippet.description}</p>
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

