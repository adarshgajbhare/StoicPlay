import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
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
    <div className="min-h-dvh bg-[#101010] text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div
            onClick={() => setShowAddModal(true)}
            className="bg-[#070707] h-52 ring-[1px] ring-white/15 rounded overflow-hidden cursor-pointer flex text-2xl/6 font-medium tracking-tight text-white hover:text-white/50 flex-col items-center justify-center gap-2"
          >
            <IconSquareRoundedPlusFilled
              size={48}
              strokeWidth={1}
              color="white"
            />
            <span className="text-lg/4 mt-2 font-normal">
              Add a new playlist
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
  // Get the first video ID from the playlist
  const getFirstVideoId = () => {
    if (playlist.videos && playlist.videos.length > 0) {
      const video = playlist.videos[0];
      if (video.id?.videoId) return video.id.videoId;
      if (video.snippet?.resourceId?.videoId) return video.snippet.resourceId.videoId;
      if (typeof video.id === "string") return video.id;
      if (video.contentDetails?.videoId) return video.contentDetails.videoId;
    }
    return null;
  };  

  return (
     <Link
        to={`/playlist/${playlist.id}`}> 
        <div className="bg-[#151515] ring-[1px] ring-white/15 rounded shadow-lg overflow-hidden transition-all duration-500 hover:shadow-xl">
      <div 
        className="relative group cursor-pointer" 
        onClick={() => {
          const videoId = getFirstVideoId();
          if (videoId) onVideoSelect(videoId);
        }}
      >
        <img
          src={playlist.thumbnail}
          alt={playlist.title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-white">{playlist.title}</h3>
        <p className="text-sm text-gray-400">{playlist.videoCount} videos</p>
      </div>
    
    </div>  </Link>
  );
}

export default PlaylistPage;