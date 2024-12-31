import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";

const LikedVideosPage = () => {
  const [likedVideos, setLikedVideos] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    const videos = JSON.parse(localStorage.getItem('likedVideos') || '[]');
    setLikedVideos(videos);
  }, []);

  return (
    <div className="min-h-dvh bg-[#101010] text-white">
      <Navbar onImportClick={() => setShowImportModal(true)} />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Liked Videos</h1>
        
        {likedVideos.length === 0 ? (
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