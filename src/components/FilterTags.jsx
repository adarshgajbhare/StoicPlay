const FilterTags = ({
  channels,
  channelDetails,
  selectedChannel,
  onChannelSelect,
  onChannelDelete,
  videos,
}) => {
  // Helper function to count videos for each channel
  const getChannelVideoCount = (channelId) => {
    return videos.filter((video) => video.snippet?.channelId === channelId)
      .length;
  };

  return (
    <div
      className="flex items-stretch p-1 flex-nowrap gap-2 text-sm/3 font-medium  mb-4 overflow-x-scroll
        md:hidden
      
      "
    >
      {/* All Channels Tag */}
      <span
        onClick={() => onChannelSelect(null)}
        className={`cursor-pointer flex-shrink-0 p-2 rounded flex items-center gap-2 ${
          selectedChannel === null
            ? "ring-[1px] ring-white/30 text-white"
            : "bg-gray-600 text-white hover:bg-gray-500"
        }`}
      >
        All Videos ({videos.length})
      </span>

      {/* Channel Tags */}
      {Object.entries(channels).map(([channelId, channelTitle]) => (
        <span
          key={channelId}
          onClick={() => onChannelSelect(channelId)}
          className={`cursor-pointer flex-shrink-0 p-2 rounded flex items-center gap-2 ${
            selectedChannel === channelId
              ? "bg-white text-black "
              : "bg-black ring-[1px] ring-white/30 text-white hover:bg-gray-500"
          }`}
        >
          <img
            src={channelDetails[channelId]?.snippet?.thumbnails?.default?.url}
            alt=""
            className="w-5 h-5 rounded-full"
          />
          {channelTitle} ({getChannelVideoCount(channelId)})
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChannelDelete(channelId);
            }}
            className="ml-1 hover:text-red-500"
            title="Remove channel"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
};

export default FilterTags;

