import React, { useState } from "react";
import { motion } from "framer-motion";

const FeedNavigation = ({ feeds = [] }) => {
  const [activeFeed, setActiveFeed] = useState("");

  const handleFeedClick = (feedName) => {
    setActiveFeed(feedName);
  };

  // Get total channels across all feeds with null checks
  const getTotalChannels = () => {
    if (!Array.isArray(feeds)) return 0;
    return feeds.reduce((total, feed) => {
      if (!feed || !feed.name || !Array.isArray(feed.channels)) return total;
      return total + feed.channels.length;
    }, 0);
  };

  // Get channel count for a specific feed
  const getChannelCount = (feedName) => {
    if (!feedName) return 0;
    const specificFeed = feeds.find((f) => f && f.name === feedName);
    if (!specificFeed || !Array.isArray(specificFeed.channels)) return 0;
    return specificFeed.channels.length;
  };

  // If feeds is not an array, render nothing
  if (!Array.isArray(feeds)) {
    return null;
  }

  return (
    <div className="mb-8 sticky top-6 z-50 justify-center gap-x-2 flex-wrap gap-y-2 hidden sm:flex">
      <button
        aria-label="All feeds"
        onClick={() => handleFeedClick("")}
        className={`py-2 px-4 flex gap-x-1 font-medium items-center border border-white border-opacity-20 rounded hover:bg-white hover:bg-opacity-10 transition-all text-sm ${
          activeFeed === "" ? "" : ""
        }`}
      >
        All
        <span className="flex justify-center items-center text-white text-opacity-60 text-sm leading-none ml-1">
          {getTotalChannels()}
        </span>
      </button>

      <div className="flex gap-x-0  rounded border border-white border-opacity-20">
        {feeds.map((feed) =>
          feed && feed.name ? (
            <button
              key={feed.name}
              onClick={() => handleFeedClick(feed.name)}
              className="py-2 px-5 flex gap-x-1 font-medium rounded transition-all relative hover:bg-white hover:bg-opacity-10"
            >
              {activeFeed === feed.name && (
                <motion.div
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  layoutId="active"
                  className="absolute inset-0 bg-white bg-opacity-20 rounded"
                />
              )}
              <span className="text-sm relative z-10">{feed.name}</span>
              <span className="flex relative z-10 justify-center items-center text-white text-opacity-60 text-sm leading-none ml-1">
                {getChannelCount(feed.name)}
              </span>
            </button>
          ) : null
        )}
      </div>
    </div>
  );
};

export default FeedNavigation;