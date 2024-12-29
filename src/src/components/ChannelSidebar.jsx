import React, { useState } from 'react';
import { Trash2, ChevronRight, ChevronLeft, Layout } from 'lucide-react';

const ChannelSidebar = ({ 
  channels, 
  channelDetails, 
  selectedChannel, 
  onChannelSelect, 
  onChannelDelete,
  totalVideosCount,
  videos 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Function to count videos for a specific channel
  const getChannelVideoCount = (channelId) => {
    return videos.filter(video => video.snippet?.channelId === channelId).length;
  };

  return (
    <div 
      className={`bg-gray-900 border-l border-white/10 h-screen fixed right-0 top-0 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h3 className="text-xl font-semibold text-white">Channels</h3>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-700 rounded transition-colors ml-auto"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronLeft size={20} className="text-white" />
          ) : (
            <ChevronRight size={20} className="text-white" />
          )}
        </button>
      </div>

      <div className="space-y-4 p-2">
        {/* All Channels Option */}
        <div 
          className={`flex items-center justify-between ${
            isCollapsed ? 'p-2' : 'p-3'
          } rounded-lg cursor-pointer transition-colors ${
            selectedChannel === null 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
          onClick={() => onChannelSelect(null)}
        >
          <div className="flex items-center space-x-3">
            <div className={`rounded-full bg-gray-700 flex items-center justify-center ${
              isCollapsed ? 'w-10 h-10' : 'w-8 h-8'
            }`}>
              <Layout size={isCollapsed ? 24 : 20} className="text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-sm font-medium text-white">All Channels</span>
                <span className="text-xs text-gray-400 block">
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
              isCollapsed ? 'p-2' : 'p-3'
            } rounded-lg cursor-pointer transition-colors ${
              selectedChannel === channelId 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => onChannelSelect(channelId)}
          >
            <div className="flex items-center space-x-3">
              <img
                src={channelDetails[channelId]?.snippet?.thumbnails?.default?.url || '/api/placeholder/48/48'}
                alt={channelTitle}
                className={`rounded-full ${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'}`}
                title={isCollapsed ? channelTitle : ''}
              />
              {!isCollapsed && (
                <div>
                  <span className="text-sm font-medium text-white truncate max-w-[120px]">
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