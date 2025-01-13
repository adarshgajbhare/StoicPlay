import React, { useState, useEffect } from "react";
import { IconLayout, IconMenu, IconTrash, IconX, IconAlertTriangle } from "@tabler/icons-react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, channelTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-[#1F1F1F] p-6 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <IconAlertTriangle className="text-red-500" size={24} />
          <h2 className="text-xl font-bold text-white">Delete Channel</h2>
        </div>
        <p className="text-gray-300 mb-4">
          Are you sure you want to delete <span className="font-semibold">{channelTitle}</span> from this feed? 
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ChannelSidebar = ({
  channels,
  channelDetails,
  selectedChannel,
  onChannelSelect,
  onChannelDelete,
  totalVideosCount,
  videos,
  isCollapsed,
  onCollapse
}) => {
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    channelId: null,
    channelTitle: ''
  });

  const getChannelVideoCount = (channelId) => {
    return videos.filter((video) => video.snippet?.channelId === channelId).length;
  };

  const handleDeleteClick = (e, channelId, channelTitle) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      channelId,
      channelTitle
    });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.channelId) {
      onChannelDelete(deleteModal.channelId);
    }
    setDeleteModal({
      isOpen: false,
      channelId: null,
      channelTitle: ''
    });
  };

  useEffect(() => {
    // Dispatch event when sidebar state changes
    const event = new CustomEvent('leftSidebarStateChange', {
      detail: { isCollapsed }
    });
    window.dispatchEvent(event);
  }, [isCollapsed]);

  return (
    <>
      <div
        id="channel-sidebar"
        className={`bg-[#323232] rounded-lg hidden md:block  popover 
          border-white/10  py-2.5 fixed right-10 top-10 bottom-96 h-[658px] z-50 overflow-y-auto transition-all duration-300 ${
            isCollapsed ? "w-16" : "w-full md:w-64"
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
            <div className="flex w-full space-x-2">
              <div
                className={`rounded bg-black flex items-center justify-center ${
                  isCollapsed ? "size-10" : "size-10"
                }`}
              >
                <IconLayout size={isCollapsed ? 36 : 36} strokeWidth={1} className="text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <span className="text-sm/3 font-medium tracking-tight text-white/60">
                    All Channels
                  </span>
                  <span className="text-xs/3 text-white/60 block">
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
                selectedChannel === channelId
                  ? "bg-black"
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
                  <div className="w-full">
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
                  onClick={(e) => handleDeleteClick(e, channelId, channelTitle)}
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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, channelId: null, channelTitle: '' })}
        onConfirm={handleConfirmDelete}
        channelTitle={deleteModal.channelTitle}
      />
    </>
  );
};

export default ChannelSidebar;

