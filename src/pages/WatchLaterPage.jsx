import React, { useState, useEffect } from "react";
import VideoCard from "../components/VideoCard";
import { getWatchLaterVideos, removeWatchLaterVideo } from "../utils/constant";
import { useAuth } from "../contexts/AuthContext";
import Toast from "../components/Toast";
import { IconSquareCheckFilled, IconMinus, IconCheck } from "@tabler/icons-react";

const WatchLaterPage = () => {
  const { user } = useAuth();
  const [watchLaterVideos, setWatchLaterVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [videosToDelete, setVideosToDelete] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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

  const toggleVideoToDelete = (videoId) => {
    const newVideosToDelete = new Set(videosToDelete);
    if (newVideosToDelete.has(videoId)) {
      newVideosToDelete.delete(videoId);
    } else {
      newVideosToDelete.add(videoId);
    }
    setVideosToDelete(newVideosToDelete);
  };

  const handleDeleteMode = () => {
    if (isDeleteMode && videosToDelete.size > 0) {
      setShowDeleteConfirmation(true);
    } else {
      setIsDeleteMode(!isDeleteMode);
      setVideosToDelete(new Set());
    }
  };

  const confirmDelete = async () => {
    try {
      await removeWatchLaterVideo(user.uid, Array.from(videosToDelete));
      setWatchLaterVideos(currentVideos => 
        currentVideos.filter(video => !videosToDelete.has(video.id?.videoId || video.id))
      );
      setToastMessage(`Successfully deleted ${videosToDelete.size} video${videosToDelete.size > 1 ? 's' : ''}`);
      setShowToast(true);
      setVideosToDelete(new Set());
      setIsDeleteMode(false);
      setShowDeleteConfirmation(false);
      const videos = await getWatchLaterVideos(user.uid);
      setWatchLaterVideos(videos);
    } catch (error) {
      console.error("Error deleting videos:", error);
      setToastMessage("Error deleting videos. Please try again.");
      setShowToast(true);
    }
  };

  if (error) {
    return (
      <div className="min-h-dvh bg-[#101010] text-white">
        <div className="container mx-auto px-4 py-8">
          <p className="text-red-500 text-center">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-dvh overflow-hidden rounded-2xl p-4 md:p-8 md:shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-white text-base md:text-2xl font-medium tracking-tight">
            Watch Later
          </h1>
          <p className="text-gray-600 text-xs md:text-xs font-medium">
            Videos saved to watch later
          </p>
        </div>
        {watchLaterVideos.length > 0 && (
          <div className="flex items-center gap-4">
            {isDeleteMode && videosToDelete.size > 0 && (
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete ({videosToDelete.size})
              </button>
            )}
            <button
              onClick={handleDeleteMode}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isDeleteMode ? "Done" : "Edit"}
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : watchLaterVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 max-w-xl mx-auto text-center">
          <h2 className="text-base font-semibold text-white">
            No videos to watch later
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            You haven't saved any videos to watch later. Start exploring and save some videos for later viewing!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
          {watchLaterVideos.map((video) => (
            <div
              key={video.id?.videoId || video.id}
              className={`relative group ${isDeleteMode ? 'animate-wiggle' : ''}`}
            >
              {isDeleteMode && (
                <button
                  onClick={() => toggleVideoToDelete(video.id?.videoId || video.id)}
                  className={`absolute -left-1 -top-1 z-20 size-5 ${
                    videosToDelete.has(video.id?.videoId || video.id) ? 'bg-red-600' : 'bg-gray-600'
                  } rounded-full flex items-center justify-center shadow-lg isolate hover:bg-red-500 transition-colors`}
                  aria-label={`Toggle delete ${video.snippet.title}`}
                >
                  {videosToDelete.has(video.id?.videoId || video.id) ? (
                    <IconCheck size={12} className="text-white" strokeWidth={2} />
                  ) : (
                    <IconMinus size={12} className="text-white" strokeWidth={2} />
                  )}
                </button>
              )}
              <VideoCard
                video={video}
                channelDetails={video.channelDetails}
                isDeleteMode={isDeleteMode}
              />
            </div>
          ))}
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#151515] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Videos?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete {videosToDelete.size} selected video{videosToDelete.size > 1 ? 's' : ''}? This action cannot be undone.
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

      <Toast
        isOpen={showToast}
        message={toastMessage}
        variant="info"
        icon={IconSquareCheckFilled}
        duration={5000}
        onClose={() => setShowToast(false)}
        position="top-right"
        showCloseButton
      />
    </div>
  );
};

export default WatchLaterPage;
