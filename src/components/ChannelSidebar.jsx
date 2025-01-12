/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { IconLayout, IconMenu, IconTrash, IconX } from "@tabler/icons-react";

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
      className={` rounded-lg  hidden md:block 
         border-white/10 min-h-dvh py-2.5 fixed right-10 top-10 bottom-96 max-h-96 z-50 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-full md:w-64 "
      }`}
    >
      <div className="flex items-center justify-between p-2">
        {!isCollapsed && (
          <h3 className="text-lg/4 font-medium text-white">Channels</h3>
        )}
        
          {isCollapsed ? (
            <button
            onClick={() => onCollapse(!isCollapsed)}
            className="p-1 hover:bg-gray-700 rounded transition-colors mx-auto"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <IconMenu size={24} className="text-white" />
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

      <div className="space-y-2 p-2">
        {/* All Channels Option */}
        <div
          className={`flex items-center justify-between ${
            isCollapsed ? "p-1" : "p-1.5"
          } rounded cursor-pointer transition-colors ${
            selectedChannel === null
              ? "bg-black"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
          onClick={() => onChannelSelect(null)}
        >
          <div className="flex  w-full space-x-2">
            <div
              className={`rounded bg-black  flex items-center justify-center ${
                isCollapsed ? "size-10" : "size-10"
              }`}
            >
              <IconLayout size={isCollapsed ? 36 : 36} strokeWidth={1} className="text-white  " />
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-sm/3 font-medium tracking-tight text-white/60  ">
                  All Channels
                </span>
                <span className="text-xs/3  text-white/60  block">
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
            <div className="flex items-center w-full space-x-2">
              <img
                src={
                  channelDetails[channelId]?.snippet?.thumbnails?.default
                    ?.url || "/api/placeholder/48/48"
                }
                alt={channelTitle}
                className={`rounded-full flex-shrink-0 ${
                  isCollapsed ? "size-10" : "size-10"
                }`}
                title={isCollapsed ? channelTitle : ""}
              />
              {!isCollapsed && (
                <div className=" w-full">
                  <div className="text-sm font-medium tracking-tight text-white max-w-[15ch] truncate">
                    {channelTitle}
                  </div>
                  <span className="text-xs/3 text-gray-400 block">
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
                <IconTrash
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
