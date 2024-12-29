import React, { useState } from "react";

function AddPlaylistModal({ isOpen, onClose, onAddPlaylist }) {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!playlistUrl.trim()) {
      setError("Please enter a playlist URL");
      return;
    }

    try {
      await onAddPlaylist(playlistUrl);
      setPlaylistUrl("");
      onClose();
    } catch (error) {
      setError("Invalid playlist URL or playlist not found");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-black ring-[1px] ring-white/10 p-6 rounded-md w-full max-w-md">
        <h2 className="text-2xl font-medium tracking-tight mb-6">
          Add YouTube Playlist
        </h2>
        <div className="mb-6">
          <label className="block mb-3 tracking-tight text-lg/4">
            Enter YouTube playlist URL
          </label>
          <input
            type="text"
            className="w-full p-3 text-white placeholder:text-white/35 ring-[1px] ring-white/20 bg-white/5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.youtube.com/playlist?list=..."
            value={playlistUrl}
            onChange={(e) => {
              setPlaylistUrl(e.target.value);
              setError("");
            }}
          />
          {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="bg-black ring-[1px] ring-white/20 flex-1 hover:bg-red-500 text-white font-medium tracking-tight text-lg/4 py-3 px-4 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-white hover:bg-green-500 hover:text-white flex-1 text-black font-medium tracking-tight text-lg/4 py-3 px-4 rounded-md"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddPlaylistModal;