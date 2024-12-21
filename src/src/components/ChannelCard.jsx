function ChannelCard({ channel, onAddChannel }) {
    const channelId = channel.id.channelId;
    const channelTitle = channel.snippet.title;
    const channelThumbnail = channel.snippet.thumbnails.default.url;
  
    const handleAddChannel = () => {
      onAddChannel(channelId, channelTitle);
    };
  
    return (
      <div className="border border-gray-600 rounded-lg p-4 text-center">
        <img
          src={channelThumbnail}
          alt={channelTitle}
          className="w-24 h-24 rounded-full mx-auto mb-2"
        />
        <p className="text-lg font-medium mb-2">{channelTitle}</p>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleAddChannel}
        >
          Add to Feed
        </button>
      </div>
    );
  }
  
  export default ChannelCard;