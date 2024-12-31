import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import AddPlaylistModal from "../components/AddPlaylistModal";
import { loadUserPlaylists, handleAddPlaylist } from "../utils/constant";
import { Link } from "react-router-dom";
import { IconSquareRoundedPlusFilled } from "@tabler/icons-react";

function PlaylistPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);

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
            className="bg-[#070707]  h-52 ring-[1px] ring-white/15 rounded  overflow-hidden cursor-pointer flex text-2xl/6 font-medium tracking-tight text-white hover:text-white/50 flex-col items-center justify-center gap-2"
          >
            <IconSquareRoundedPlusFilled
              size={48}
              strokeWidth={1}
              color="white"
            />
            <span className="text-lg/4  mt-2 font-normal">
              Add a new playlist
            </span>
          </div> 

          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
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
    </div>
  );
}

function PlaylistCard({ playlist }) {
  return (
    <Link
      to={`/playlist/${playlist.id}`}
      className="bg-[#151515] ring-[1px] ring-white/15 rounded  shadow-lg overflow-hidden transition-all duration-500 hover:shadow-xl"
    >
      <img
        src={playlist.thumbnail}
        alt={playlist.title}
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-medium text-white">{playlist.title}</h3>
        <p className="text-sm text-gray-400">{playlist.videoCount} videos</p>
      </div>
    </Link>
  );
}

export default PlaylistPage;