import { IconTrash } from "@tabler/icons-react";

/* eslint-disable react/prop-types */
const FilterTags = ({
  channels,
  channelDetails,
  selectedChannel,
  onChannelSelect,
  onChannelDelete,
  videos,
  hasChannels
}) => {
  // Helper function to count videos for each channel
  const getChannelVideoCount = (channelId) => {
    return videos.filter((video) => video.snippet?.channelId === channelId)
      .length;
  };

  return (
    <div
      className="flex items-stretch p-1 flex-nowrap gap-2 text-sm/3 font-medium  mb-4 overflow-x-scroll popover
        md:hidden
      
      "
    >
      {/* All Channels Tag */}
      <span
        onClick={() => onChannelSelect(null)}
        className={`cursor-pointer flex-shrink-0 p-2 rounded flex items-center gap-2  ${
          !hasChannels ? "hidden" : "md:block"
        } ${
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
          className={`cursor-pointer flex-shrink-0 p-1.5 rounded-full text-sm/3 flex items-center gap-2 ${
            selectedChannel === channelId
              ? "bg-white text-black "
              : "bg-transparent ring-[1px] ring-white/30 text-white hover:bg-gray-500"
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={0.8}
              stroke="currentColor"
              className="size-4  scale-[1.25]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
};

export default FilterTags;

