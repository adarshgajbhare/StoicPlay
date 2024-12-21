import React, { useEffect, useState } from 'react';

function VideoPlayer({ videoId, onClose }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!videoId) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl aspect-video">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-pink-500 transition-colors duration-200"
          aria-label="Close video"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="w-full h-full bg-black rounded-lg overflow-hidden">
          {error ? (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p>Error loading video. Please try again.</p>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              onError={() => setError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;

