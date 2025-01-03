import React, { useState } from "react";
import { Trash2, ChevronRight, ChevronLeft, Layout } from "lucide-react";
import { IconMenu, IconMenu2, IconX } from "@tabler/icons-react";

const ChannelSidebar = ({
  channels,
  channelDetails,
  selectedChannel,
  onChannelSelect,
  onChannelDelete,
  totalVideosCount,
  videos,
  isCollapsed,    // Add this prop
  onCollapse  
}) => {


  // Function to count videos for a specific channel
  const getChannelVideoCount = (channelId) => {
    return videos.filter((video) => video.snippet?.channelId === channelId)
      .length;
  };

  return (
    <div
    id="channel-sidebar"
      className={`bg-[#202020]   hidden md:block 
         border-white/10 min-h-dvh py-2.5 fixed right-0 top-0 z-50 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-full md:w-64 "
      }`}
    >
      <div className="flex items-center justify-between py-2 px-4">
        {!isCollapsed && (
          <h3 className="text-lg/4 font-medium text-white">Channels</h3>
        )}
        
          {isCollapsed ? (
            <button
            onClick={() => onCollapse(!isCollapsed)}
            className="p-1 hover:bg-gray-700 rounded transition-colors mx-auto"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <IconMenu size={28} className="text-white" />
            </button>
          ) : (
            <button
            onClick={() => onCollapse(!isCollapsed)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <IconX size={24} className="text-white" />
            </button>
          )}
        
      </div>

      <div className="space-y-2  mt-5 p-2">
        {/* All Channels Option */}
        <div
          className={`flex items-center justify-between ${
            isCollapsed ? "p-1" : "p-1.5"
          } rounded cursor-pointer transition-colors ${
            selectedChannel === null
              ? "bg-white"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
          onClick={() => onChannelSelect(null)}
        >
          <div className="flex  w-full space-x-2">
            <div
              className={`rounded bg-white  flex items-center justify-center ${
                isCollapsed ? "size-10" : "size-10"
              }`}
            >
              <Layout size={isCollapsed ? 36 : 36} strokeWidth={1} className="text-black  " />
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-sm/3 font-medium tracking-tight text-black  ">
                  All Channels
                </span>
                <span className="text-xs/3 text-gray-600 block">
                  {totalVideosCount} videos
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Individual Channels */}
        {Object.entries(channels).map(([channelId, channelTitle]) => (
          <div
            key={channelId}
            className={`flex items-center justify-between ${
              isCollapsed ? "p-1" : "p-1.5"
            } rounded cursor-pointer transition-colors ${
              selectedChannel === null
                ? "bg-black/0 hover:ring-[1px] ring-white/50"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
            onClick={() => onChannelSelect(channelId)}
          >
            <div className="flex w-full space-x-2">
              <img
                src={
                  channelDetails[channelId]?.snippet?.thumbnails?.default
                    ?.url || "/api/placeholder/48/48"
                }
                alt={channelTitle}
                className={`rounded ${
                  isCollapsed ? "size-10" : "size-10"
                }`}
                title={isCollapsed ? channelTitle : ""}
              />
              {!isCollapsed && (
                <div>
                  <span className="text-sm font-medium tracking-tight text-red-500  line-clamp-1  ">
                    {channelTitle}
                  </span>
                  <span className="text-xs text-gray-400 block">
                    {getChannelVideoCount(channelId)} videos
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChannelDelete(channelId);
                }}
                className="p-1 hover:bg-red-500 rounded transition-colors group"
                aria-label={`Remove ${channelTitle}`}
                title="Remove channel"
              >
                <Trash2
                  size={16}
                  className="text-white opacity-60 group-hover:opacity-100"
                />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelSidebar;
