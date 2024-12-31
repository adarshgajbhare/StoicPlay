import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";
import { getLikedVideos } from "../utils/constant";
import { useAuth } from "../contexts/AuthContext";

const LikedVideosPage = () => {
  const [likedVideos, setLikedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLikedVideos = async () => {
      try {
        setIsLoading(true);
        const videos = await getLikedVideos(user.uid);
        setLikedVideos(videos);
      } catch (error) {
        console.error("Error fetching liked videos:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchLikedVideos();
    }
  }, [user]);

  if (error) {
    return (
      <div className="min-h-dvh bg-[#101010] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-red-500 text-center">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#101010] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Liked Videos</h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : likedVideos.length === 0 ? (
          <p className="text-center text-gray-400">No liked videos yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {likedVideos.map((video) => (
              <VideoCard
                key={video.id?.videoId || video.id}
                video={video}
                channelDetails={video.channelDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedVideosPage;