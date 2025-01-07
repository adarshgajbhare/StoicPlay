import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";
import { getWatchLaterVideos } from "../utils/constant";
import { useAuth } from "../contexts/AuthContext";

const WatchLaterPage = () => {
  const [watchLaterVideos, setWatchLaterVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWatchLaterVideos = async () => {
      try {
        setIsLoading(true);
        const videos = await getWatchLaterVideos(user.uid);
        setWatchLaterVideos(videos);
      } catch (error) {
        console.error("Error fetching watch later videos:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchWatchLaterVideos();
    }
  }, [user]);
  

    const handleVideoRemoved = (removedVideoId) => {
    setWatchLaterVideos(prevVideos => {
        const updatedVideos = [...prevVideos];
      const index = updatedVideos.findIndex(video => {
          const videoId = video.id?.videoId || video.id;
        return videoId === removedVideoId;
      });
      if (index > -1) {
            updatedVideos.splice(index, 1)
            
        }
      return updatedVideos;
    });
    
  };
  if (error) {
    return (
      <div className="min-h-dvh bg-[#101010] text-white">
        {/* <Navbar /> */}
        <div className="container mx-auto px-4 py-8">
          <p className="text-red-500 text-center">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-dvh  rounded-2xl md:p-6 md:ring-[1px] md:ring-white/20">
      {/* <Navbar /> */}
      <div className="container mx-auto md:py-8">
        <h1 className="text-xl font-bold mb-4 text-white">Watch Later</h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : watchLaterVideos.length === 0 ? (
          <p className="text-center text-gray-400">No videos in watch later</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {watchLaterVideos.map((video) => (
              <VideoCard
                key={video.id?.videoId || video.id}
                video={video}
                channelDetails={video.channelDetails}
                variant="watchlater"
                onVideoRemoved={handleVideoRemoved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchLaterPage;
