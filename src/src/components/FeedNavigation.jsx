import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FeedNavigation = ({ feeds = [] }) => {
  const [activeFeed, setActiveFeed] = useState('');

  const handleFeedClick = (feedName) => {
    setActiveFeed(feedName);
    if (feedName) {
      const feedData = localStorage.getItem(feedName);
      if (feedData) {
        console.log('Selected feed:', feedName, JSON.parse(feedData));
      }
    }
  };

  // Get total channels across all feeds with null checks
  const getTotalChannels = () => {
    if (!Array.isArray(feeds)) return 0;
    
    return feeds.reduce((total, feed) => {
      if (!feed || !feed.name) return total;
      const feedData = localStorage.getItem(feed.name);
      let channels = 0;
      try {
        channels = feedData ? JSON.parse(feedData).length : 0;
      } catch (e) {
        console.error('Error parsing feed data:', e);
      }
      return total + channels;
    }, 0);
  };

  // Get channel count for a specific feed with null checks
  const getChannelCount = (feedName) => {
    if (!feedName) return 0;
    const feedData = localStorage.getItem(feedName);
    try {
      return feedData ? JSON.parse(feedData).length : 0;
    } catch (e) {
      console.error('Error parsing feed data:', e);
      return 0;
    }
  };

  // If feeds is not an array, render nothing
  if (!Array.isArray(feeds)) {
    return null;
  }

  return (
    <div className="mb-8 sticky top-6 z-50 justify-center gap-x-2 flex-wrap gap-y-2 hidden sm:flex">
      <button
        aria-label="All feeds"
        onClick={() => handleFeedClick('')}
        className={`py-2 px-4 flex gap-x-1 font-medium items-center border border-white border-opacity-20 rounded-xl hover:bg-white hover:bg-opacity-10 transition-all text-sm ${
          activeFeed === "" ? "bg-white bg-opacity-20" : ""
        }`}
      >
        All
        <span className="flex justify-center items-center text-white text-opacity-60 text-sm leading-none ml-1">
          {getTotalChannels()}
        </span>
      </button>

      <div className="flex gap-x-0 bg-white bg-opacity-10 rounded-xl border border-white border-opacity-20">
        {feeds.map((feed) => feed && feed.name ? (
          <button
            key={feed.name}
            onClick={() => handleFeedClick(feed.name)}
            className="py-2 px-5 flex gap-x-1 font-medium rounded-xl transition-all relative hover:bg-white hover:bg-opacity-10"
          >
            {activeFeed === feed.name && (
              <motion.div
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                layoutId="active"
                className="absolute inset-0 bg-white bg-opacity-20 rounded-xl"
              />
            )}
            <span className="text-sm relative z-10">
              {feed.name}
            </span>
            <span className="flex relative z-10 justify-center items-center text-white text-opacity-60 text-sm leading-none ml-1">
              {getChannelCount(feed.name)}
            </span>
          </button>
        ) : null)}
      </div>
    </div>
  );
};

export default FeedNavigation;