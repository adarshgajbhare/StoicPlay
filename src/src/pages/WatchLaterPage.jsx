import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";
import { getWatchLaterVideos } from "../utils/constant";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

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
    };

    if (user) {
      fetchWatchLaterVideos();
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl tracking-tight font-medium mb-8">
          Watch Later
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : watchLaterVideos.length === 0 ? (
          <div className="max-w-2xl bg-[#101010] mx-auto rounded text-center p-6">
            <div className="mb-8">
              <svg
                className="w-48 h-48 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-4">
              No Videos in Watch Later
            </h2>
            <p className="text-white/75 text-xl max-w-md mx-auto mb-8">
              Start adding videos to your Watch Later list to keep track of
              content you want to watch.
            </p>
            <Link to="/feeds" className="">
              <button className="rounded bg-white px-6 py-4 text-lg font-medium text-gray-950 md:w-2/5 text-center drop-shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                Go to Feed
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {watchLaterVideos.map((video) => (
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

export default WatchLaterPage;
