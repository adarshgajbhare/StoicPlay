import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import AddPlaylistModal from "../components/AddPlaylistModal";
import { loadUserPlaylists, handleAddPlaylist } from "../utils/constant";
import { Link } from "react-router-dom";
import { IconSquareRoundedPlusFilled } from "@tabler/icons-react";
import VideoPlayer from "../components/VideoPlayer";
function PlaylistPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserPlaylists(user, setPlaylists);
    }
  }, [user]);

  const handleAddNewPlaylist = async (playlistUrl) => {
    try {
      const newPlaylist = await handleAddPlaylist(user, playlistUrl);
      setPlaylists([...playlists, newPlaylist]);
    } catch (error) {
      console.error("Error adding playlist:", error);
    }
  };

  return (
    <div className="w-full min-h-dvh  rounded-2xl p-0 md:p-6 md:ring-[1px] md:ring-white/20">
      <h1 className=" text-xl md:text-2xl text-white font-medium md:ml-6 ">Your Playlists</h1>
      <main className="max-w-[1800px] mx-auto  lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          <div
            onClick={() => setShowAddModal(true)}
            className="aspect-video bg-[#070707] 
            

            rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 
            hover:bg-[#3f3f3f] transition-colors duration-200"
          >
            <IconSquareRoundedPlusFilled
              size={40}
              strokeWidth={1}
              color="white"
              className="text-gray-300 "
            />
            <span className="text-white text-sm font-medium">
              Create new playlist
            </span>
          </div>

          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onVideoSelect={(videoId) => setCurrentVideo(videoId)}
            />
          ))}
        </div>
      </main>

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
    </div>
  );
}

function PlaylistCard({ playlist, onVideoSelect }) {
  const getFirstVideoId = () => {
    if (playlist?.videos && playlist?.videos?.length > 0) {
      const video = playlist?.videos[0];
      if (video.id?.videoId) return video.id.videoId;
      if (video.snippet?.resourceId?.videoId)
        return video?.snippet?.resourceId?.videoId;
      if (typeof video.id === "string") return video.id;
      if (video?.contentDetails?.videoId) return video?.contentDetails?.videoId;
    }
    return null;
  };

  return (
    <Link
      to={`/playlist/${playlist.id}`}
      state={{ playlistDetails: { title: playlist?.title } }}
      className="block"
    >
      <div className="group cursor-pointer">
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
          <h3 className="text-white text-lg/5 mt-1 font-medium line-clamp-2">
            {playlist?.title}
          </h3>
          <p className="text-[#AAAAAA] text-sm mt-1 mb-3">View full playlist</p>
        </div>
      </div>
    </Link>
  );
}

export default PlaylistPage;
