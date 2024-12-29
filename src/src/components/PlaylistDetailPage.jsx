import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchPlaylistVideos } from "../services/youtubeApi";
import VideoCard from "../components/VideoCard";
import Navbar from "../components/Navbar";
import { IconChevronsLeft } from "@tabler/icons-react";

function PlaylistDetailPage() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playlistDetails, setPlaylistDetails] = useState(null);

  useEffect(() => {
    const loadPlaylistVideos = async () => {
      try {
        setLoading(true);
        const data = await fetchPlaylistVideos(playlistId);
        setVideos(data);
        if (data.length > 0) {
          setPlaylistDetails({
            title: data[0].snippet.playlistTitle,
            channelTitle: data[0].snippet.channelTitle,
          });
        }
      } catch (error) {
        console.error("Error loading playlist videos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (playlistId) {
      loadPlaylistVideos();
    }
  }, [playlistId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#101010] text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <Navbar />
        <div className="flex md:flex-row justify-between flex-col gap-4 mb-8">
          <Link to="/playlists" className="flex items-center gap-2">
            <div className="text-white transition-colors duration-500">
              <IconChevronsLeft
                size={36}
                strokeWidth={1}
                className="scale-150 text-white"
              />
            </div>
            <h1 className="text-2xl lg:text-4xl font-medium text-center text-white tracking-tight">
              {playlistDetails?.title || "Playlist"}
            </h1>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.contentDetails.videoId}
              video={video}
              channelDetails={{
                title: video.snippet.channelTitle,
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default PlaylistDetailPage;