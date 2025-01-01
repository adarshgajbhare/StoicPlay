import React, { useEffect, useState } from 'react';

function VideoPlayer({ videoId, onClose }) {
  const [error, setError] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Add meta viewport for proper mobile scaling when video is open
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    const originalContent = viewport?.getAttribute('content');
    
    // Prevent pinch-zoom while video is playing
    viewport?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    
    // Cleanup
    return () => {
      viewport?.setAttribute('content', originalContent || 'width=device-width, initial-scale=1.0');
    };
  }, []);

  useEffect(() => {
    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Handle back button
    const handlePopState = (e) => {
      e.preventDefault();
      onClose();
    };

    // Add event listeners
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('popstate', handlePopState);
    
    // Push state to enable back button to close
    window.history.pushState(null, '');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Handle swipe down to close
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchEnd - touchStart;
    const isDownSwipe = distance > minSwipeDistance;
    
    if (isDownSwipe) {
      onClose();
    }
  };

  if (!videoId) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative w-full h-full md:h-auto md:w-[90%] max-w-4xl md:aspect-video">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-pink-500 transition-colors duration-200 p-2 md:p-0"
          aria-label="Close video"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="w-full h-full bg-black rounded-md overflow-hidden">
          {error ? (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p>Error loading video. Please try again.</p>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
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