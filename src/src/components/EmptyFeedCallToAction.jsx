import React, { useState } from "react";
import SearchPopover from "./SearchPopover";

const EmptyFeedCallToAction = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [feedChannels, setFeedChannels] = useState({});
  const [channelDetails, setChannelDetails] = useState({});

  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [currentFeed, setCurrentFeed] = useState(null);
  const handleChannelAdded = () => {
    setFeedChannels({});
    setChannelDetails({});
    setVideos([]);
    setIsLoading(true);
    setTimeout(() => {
      loadFeedData();
    }, 100);
  };
  return (
    <div className="max-w-2xl bg-[#121212]  mx-auto rounded-md  text-center">
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
        Your feed is empty, add more
      </h2>
      <p className="text-white/75 text-xl/7 max-w-md mx-auto mb-8">
        Start adding your favorite YouTube channels to create your personalized
        ZenFeed.
      </p>
      <button
        className={`rounded-md bg-white px-6 py-4 text-lg/4 font-medium text-gray-950  md:w-1/2 text-center  drop-shadow-md transition duration-300 ease-in-out transform ${
          isHovered ? "scale-105" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsSearchPopoverOpen(true)}
      >
        Add Your First Channel
      </button>
      <div className="mt-12 text-sm text-gray-500">
        <p>Need help getting started?</p>
        <a href="#" className="text-blue-500 hover:underline">
          Watch a video tutorial to get started
        </a>
      </div>
      <SearchPopover
        isOpen={isSearchPopoverOpen}
        onClose={() => setIsSearchPopoverOpen(false)}
        onChannelAdded={handleChannelAdded}
      />
    </div>
  );
};

export default EmptyFeedCallToAction;
