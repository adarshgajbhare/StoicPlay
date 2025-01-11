/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AddPlaylistModal from "../components/AddPlaylistModal";
import { loadUserPlaylists, handleAddPlaylist, handleDeletePlaylist } from "../utils/constant";
import { 
  IconSquareRoundedPlusFilled, 
  IconMinus, 
  IconSquareCheckFilled,
  IconCheck 
} from "@tabler/icons-react";
import VideoPlayer from "../components/VideoPlayer";

function PlaylistPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [playlistsToDelete, setPlaylistsToDelete] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserPlaylists(user, setPlaylists);
    }
  }, [user]);

  const handleAddNewPlaylist = async (playlistUrl) => {
    try {
      const newPlaylist = await handleAddPlaylist(user, playlistUrl);
      setPlaylists([...playlists, newPlaylist]);
      showToastMessage("New playlist added successfully");
    } catch (error) {
      console.error("Error adding playlist:", error);
      showToastMessage("Error adding playlist. Please try again.");
    }
  };

  const togglePlaylistToDelete = (playlistId) => {
    const newPlaylistsToDelete = new Set(playlistsToDelete);
    if (newPlaylistsToDelete.has(playlistId)) {
      newPlaylistsToDelete.delete(playlistId);
    } else {
      newPlaylistsToDelete.add(playlistId);
    }
    setPlaylistsToDelete(newPlaylistsToDelete);
  };

  const handleDeleteMode = () => {
    if (isDeleteMode && playlistsToDelete.size > 0) {
      setShowDeleteConfirmation(true);
    } else {
      setIsDeleteMode(!isDeleteMode);
      setPlaylistsToDelete(new Set());
    }
  };

  const confirmDelete = async () => {
    try {
      await handleDeletePlaylist(user, Array.from(playlistsToDelete));
      setPlaylists(currentPlaylists => 
        currentPlaylists.filter(playlist => !playlistsToDelete.has(playlist.id))
      );
      showToastMessage(`Successfully deleted ${playlistsToDelete.size} playlist${playlistsToDelete.size > 1 ? 's' : ''}`);
      setPlaylistsToDelete(new Set());
      setIsDeleteMode(false);
      setShowDeleteConfirmation(false);
      await loadUserPlaylists(user, setPlaylists);
    } catch (error) {
      console.error("Error deleting playlists:", error);
      showToastMessage("Error deleting playlists. Please try again.");
    }
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="w-full min-h-dvh overflow-hidden rounded-2xl p-0 md:p-8 md:shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-white text-2xl md:text-4xl font-medium tracking-tight">
            Your Playlists
          </h1>
          <p className="text-gray-600 text-xs md:text-base font-medium">
            Import playlists from YouTube
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isDeleteMode && playlistsToDelete.size > 0 && (
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete ({playlistsToDelete.size})
            </button>
          )}
          <button
            onClick={handleDeleteMode}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isDeleteMode ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        <div>
          <div
            onClick={() => !isDeleteMode && setShowAddModal(true)}
            className={`aspect-video bg-[#151515] rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-[#3f3f3f]/30 transition-colors duration-200 shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)] ${
              isDeleteMode ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <IconSquareRoundedPlusFilled
              size={40}
              strokeWidth={1}
              className="text-gray-500"
            />
          </div>
          <p className="text-lg/4 mt-3 font-medium text-gray-500 text-center">
            Add new playlist
          </p>
        </div>

        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist?.id}
            playlist={playlist}
            onVideoSelect={(videoId) => setCurrentVideo(videoId)}
            isDeleteMode={isDeleteMode}
            isSelected={playlistsToDelete.has(playlist.id)}
            onToggleDelete={() => togglePlaylistToDelete(playlist.id)}
          />
        ))}
      </div>

      {showAddModal && (
        <AddPlaylistModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddPlaylist={handleAddNewPlaylist}
        />
      )}

      {currentVideo && (
        <VideoPlayer
          videoId={currentVideo}
          onClose={() => setCurrentVideo(null)}
        />
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#151515] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Playlists?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete {playlistsToDelete.size} selected playlist{playlistsToDelete.size > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed flex items-start w-80 gap-2.5 top-6 right-6 z-50 bg-[#151515] filter backdrop-blur-xl text-white p-4 rounded-2xl shadow-[inset_0.1px_0.5px_0.6px_0.5px_rgba(255,255,255,0.2)] text-sm font-medium saturate-200 overflow-hidden">
          <div className="flex-shrink-0">
            <IconSquareCheckFilled
              size={18}
              strokeWidth={1}
              className="relative top-[5px] text-gray-50"
            />
          </div>
          <div>
            <h1 className="text-lg font-[600] tracking-tight">
              {toastMessage}
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaylistCard({ playlist, onVideoSelect, isDeleteMode, isSelected, onToggleDelete }) {
  return (
    <div className="relative group">
      {isDeleteMode && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleDelete();
          }}
          className={`absolute -left-1 -top-1 z-20 size-5 ${
            isSelected ? 'bg-red-600' : 'bg-gray-600'
          } rounded-full flex items-center justify-center shadow-lg isolate hover:bg-red-500 transition-colors`}
          aria-label={`Toggle delete ${playlist.title}`}
        >
          {isSelected ? (
            <IconCheck size={12} className="text-white" strokeWidth={2} />
          ) : (
            <IconMinus size={12} className="text-white" strokeWidth={2} />
          )}
        </button>
      )}
      <Link
        to={isDeleteMode ? "#" : `/playlist/${playlist?.id}`}
        state={{ playlistDetails: { title: playlist?.title } }}
        className={`block ${isDeleteMode ? 'pointer-events-none' : ''}`}
      >
        <div className={`group cursor-pointer ${isDeleteMode ? 'animate-wiggle' : ''}`}>
          <div className="relative aspect-video">
            <img
              src={playlist?.thumbnail}
              alt={"playlist thumbnail"}
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 rounded-xl flex items-center justify-center">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-12 h-12"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 text-xs text-white rounded">
              {playlist?.videoCount} videos
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-white text-sm mt-1 font-medium line-clamp-1">
              {playlist?.title}
            </h3>
            <p className="text-[#AAAAAA] text-xs mb-3">View full playlist</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default PlaylistPage;
