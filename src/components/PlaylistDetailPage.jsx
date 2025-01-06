import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchPlaylistVideos } from "../services/youtubeApi";
import VideoCard from "../components/VideoCard";
import Navbar from "../components/Navbar";
import { IconChevronsLeft, IconDotsVertical } from "@tabler/icons-react";

function PlaylistDetailPage() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playlistDetails, setPlaylistDetails] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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
            totalVideos: data.length,
            thumbnail: data[0].snippet.thumbnails?.maxres?.url || data[0].snippet.thumbnails?.high?.url,
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
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0f0f0f] text-white">
      <Navbar />
      <main className="max-w-[1800px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 p-4">
          {/* Video Player Section */}
          <div className="lg:flex-grow">
            {videos[currentVideoIndex] && (
              <div>
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videos[currentVideoIndex].contentDetails.videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="mt-4">
                  <h1 className="text-xl font-medium">{videos[currentVideoIndex].snippet.title}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-[#AAAAAA]">{playlistDetails?.channelTitle}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Playlist Section */}
          <div className="lg:w-[400px] flex-shrink-0">
            <div className="bg-[#272727] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">{playlistDetails?.title}</h2>
                <button className="p-2 hover:bg-white/10 rounded-full">
                  <IconDotsVertical size={20} />
                </button>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {videos.map((video, index) => (
                  <div
                    key={video.contentDetails.videoId}
                    className={`flex gap-2 p-2 rounded-lg cursor-pointer ${
                      currentVideoIndex === index ? "bg-white/20" : "hover:bg-white/10"
                    }`}
                    onClick={() => setCurrentVideoIndex(index)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.snippet.thumbnails?.medium?.url}
                        alt={video.snippet.title}
                        className="w-32 h-18 object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1 text-xs rounded">
                        {video.contentDetails.duration}
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-sm font-medium line-clamp-2">{video.snippet.title}</h3>
                      <p className="text-xs text-[#AAAAAA] mt-1">{video.snippet.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PlaylistDetailPage;

