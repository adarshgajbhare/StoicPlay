import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import EditFeedModal from "../components/EditFeedModal";
import {
  fetchChannelVideos,
  fetchChannelDetails,
} from "../services/youtubeApi";
import { useAuth } from "../contexts/AuthContext";
import EmptyFeedCallToAction from "../components/EmptyFeedCallToAction";
import SearchPopover from "../components/SearchPopover";
import { IconChevronLeft, IconPlus, IconEdit, IconLoader } from "@tabler/icons-react";
import ChannelSidebar from "../components/ChannelSidebar";
import {
  loadFeedData,
  handleChannelDelete,
  handleUpdateFeed,
} from "../utils/constant";
import FilterTags from "../components/FilterTags";
import VideoCard from "../components/VideoCard";

function FeedPage() {
  const { user } = useAuth();
  const { feedName } = useParams();
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasChannels, setHasChannels] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [feedChannels, setFeedChannels] = useState({});
  const [channelDetails, setChannelDetails] = useState({});
  const [channelPageTokens, setChannelPageTokens] = useState({}); // Track pagination tokens for each channel
  const [channelsHasMore, setChannelsHasMore] = useState({}); // Track if each channel has more videos
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [currentFeed, setCurrentFeed] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (selectedChannel) {
      const channelVideos = videos.filter(
        (video) => video.snippet?.channelId === selectedChannel
      );
      setFilteredVideos(channelVideos);
    } else {
      setFilteredVideos(videos);
    }
  }, [selectedChannel, videos]);

  useEffect(() => {
    loadFeedData(
      user,
      feedName,
      setCurrentFeed,
      setFeedChannels,
      setHasChannels,
      setInitialLoad
    );
  }, [feedName, user]);

  useEffect(() => {
    if (hasChannels) {
      loadChannelDetails();
    } else {
      setVideos([]);
      setIsLoading(false);
      setInitialLoad(false);
    }
  }, [hasChannels]);

  const loadChannelDetails = async () => {
    const details = {};
    for (const channelId of Object.keys(feedChannels)) {
      try {
        const channelDetail = await fetchChannelDetails(channelId);
        details[channelId] = channelDetail;
      } catch (error) {
        console.error(
          `Error fetching details for channel ${channelId}:`,
          error
        );
      }
    }
    setChannelDetails(details);
    loadInitialFeedVideos(details);
  };

  const loadInitialFeedVideos = async (channelDetailsMap) => {
    setIsLoading(true);
    try {
      let allVideos = [];
      const pageTokens = {};
      const hasMoreData = {};

      for (const channelId in feedChannels) {
        try {
          // Fetch only the latest video (maxResults = 1)
          const result = await fetchChannelVideos(channelId, null, 1);
          if (result.videos && Array.isArray(result.videos)) {
            result.videos.forEach((video) => {
              video.channelDetails = channelDetailsMap[channelId];
              allVideos.push(video);
            });
            
            // Store pagination info for each channel
            pageTokens[channelId] = result.nextPageToken;
            hasMoreData[channelId] = result.hasMore;
          }
        } catch (error) {
          console.error(
            `Error fetching videos for channel ${channelId}:`,
            error
          );
          hasMoreData[channelId] = false;
        }
      }

      // Sort videos by published date (newest first)
      allVideos.sort(
        (a, b) =>
          new Date(b.snippet?.publishedAt || 0) -
          new Date(a.snippet?.publishedAt || 0)
      );

      setVideos(allVideos);
      setChannelPageTokens(pageTokens);
      setChannelsHasMore(hasMoreData);
    } catch (error) {
      console.error("Error loading initial feed videos:", error);
      setVideos([]);
    } finally {
      setIsLoading(false);
      setInitialLoad(false);
    }
  };

  const loadMoreVideos = async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      let newVideos = [];
      const updatedPageTokens = { ...channelPageTokens };
      const updatedHasMore = { ...channelsHasMore };
      let hasAnyNewVideo = false;

      for (const channelId in feedChannels) {
        // Skip channels that don't have more videos
        if (!channelsHasMore[channelId]) continue;
        
        try {
          // Fetch next batch of videos for this channel (maxResults = 10 for load more)
          const result = await fetchChannelVideos(
            channelId, 
            channelPageTokens[channelId], 
            10
          );
          
          if (result.videos && Array.isArray(result.videos)) {
            result.videos.forEach((video) => {
              video.channelDetails = channelDetails[channelId];
              newVideos.push(video);
            });
            
            // Update pagination info
            updatedPageTokens[channelId] = result.nextPageToken;
            updatedHasMore[channelId] = result.hasMore;
            
            if (result.videos.length > 0) {
              hasAnyNewVideo = true;
            }
          }
        } catch (error) {
          console.error(
            `Error fetching more videos for channel ${channelId}:`,
            error
          );
          updatedHasMore[channelId] = false;
        }
      }

      if (hasAnyNewVideo) {
        // Combine with existing videos and sort
        const combinedVideos = [...videos, ...newVideos];
        combinedVideos.sort(
          (a, b) =>
            new Date(b.snippet?.publishedAt || 0) -
            new Date(a.snippet?.publishedAt || 0)
        );
        
        setVideos(combinedVideos);
      }
      
      setChannelPageTokens(updatedPageTokens);
      setChannelsHasMore(updatedHasMore);
    } catch (error) {
      console.error("Error loading more videos:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Check if any channel has more videos to load
  const hasMoreVideosToLoad = Object.values(channelsHasMore).some(hasMore => hasMore);

  const handleChannelAdded = () => {
    setFeedChannels({});
    setChannelDetails({});
    setVideos([]);
    setChannelPageTokens({});
    setChannelsHasMore({});
    setIsLoading(true);
    setTimeout(() => {
      loadFeedData(
        user,
        feedName,
        setCurrentFeed,
        setFeedChannels,
        setHasChannels,
        setInitialLoad
      );
    }, 100);
  };

  const getGridColumns = () => {
    if (isCollapsed && isLeftSidebarCollapsed) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'; // Both sidebars closed
    } else if (!isCollapsed && !isLeftSidebarCollapsed) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'; // Both sidebars open
    } else {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'; // One sidebar open
    }
  };
  

  useEffect(() => {
    const handleLeftSidebar = (e) => {
      if (e.detail) {
        setIsLeftSidebarCollapsed(e.detail.isCollapsed);
      }
    };

    window.addEventListener('leftSidebarStateChange', handleLeftSidebar);
    return () => window.removeEventListener('leftSidebarStateChange', handleLeftSidebar);
  }, []);

  return (
    <div 
      className={`w-full ${!hasChannels ? 'h-[700px] overflow-hidden' : 'min-h-dvh'}
       rounded-2xl p-4 bg-[#101010] popover md:shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]`}
    >
      <div
        id="feed-side"
        className={`
          ${hasChannels ? 'overflow-hidden' : 'overflow-auto'}
          ${
            isCollapsed
              ? "max-w-8xl md:pr-16 transition-all duration-300"
              : "max-w-8xl md:pr-64 transition-all duration-300"
          }
        `}
      >
        <div className="flex rounded-lg p-2 justify-between gap-4 mb-8">
          <Link to="/feeds" className="flex items-center gap-2">
            <div className="text-white transition-colors duration-500">
              <IconChevronLeft
                size={16}
                strokeWidth={1}
                className="scale-[2] text-white"
              />
            </div>
            <h1 className="text-xl lg:text-2xl relative right-1.5 md:right-0 font-medium text-center text-white tracking-tight">
              {feedName}
            </h1>
          </Link>
          <div className="flex space-x-2 ">
            <button
              onClick={() => setIsSearchPopoverOpen(true)}
              className=" hover:bg-white hover:text-black  flex items-center
               bg-white/10 text-white p-3 rounded-full ml-1 md:inline"
              aria-label="Add Channel">
              <IconPlus size={20} />
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
             className=" hover:bg-white  hover:text-black flex items-center
               bg-white/10 text-white p-3 rounded-full ml-1 md:inline"
              aria-label="Edit Feed"
            >
              <IconEdit size={20} />
        
            </button>
          </div>
        </div>
        <p className={`text-base  text-white text md:font-2xl mb-4 ${!hasChannels ? "hidden" :" md:block"} `}>
          {selectedChannel
            ? `Videos from ${feedChannels[selectedChannel]}`
            : "All Videos"}
        </p>

        <FilterTags
          channels={feedChannels}
          channelDetails={channelDetails}
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
          onChannelDelete={(channelIdToDelete) =>
            handleChannelDelete(
              user,
              feedName,
              channelIdToDelete,
              selectedChannel,
              setSelectedChannel,
              () =>
                loadFeedData(
                  user,
                  feedName,
                  setCurrentFeed,
                  setFeedChannels,
                  setHasChannels,
                  setInitialLoad
                )
            )
          }
          videos={videos}
        />

        {initialLoad ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : !hasChannels ? (
          <EmptyFeedCallToAction />
        ) : isLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className={`grid ${getGridColumns()} gap-6 md:p-4 p-0 transition-all duration-300`}>
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id?.videoId || video.id}
                  video={video}
                  channelDetails={video.channelDetails}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMoreVideosToLoad && filteredVideos.length > 0 && (
              <div className="flex justify-center mt-8 mb-4">
                <button
                  onClick={loadMoreVideos}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <IconLoader className="animate-spin" size={20} />
                      Loading...
                    </>
                  ) : (
                    'Load More Videos'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        <ChannelSidebar
          channels={feedChannels}
          channelDetails={channelDetails}
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
          onChannelDelete={(channelIdToDelete) =>
            handleChannelDelete(
              user,
              feedName,
              channelIdToDelete,
              selectedChannel,
              setSelectedChannel,
              () =>
                loadFeedData(
                  user,
                  feedName,
                  setCurrentFeed,
                  setFeedChannels,
                  setHasChannels,
                  setInitialLoad
                )
            )
          }
          totalVideosCount={videos.length}
          videos={videos}
          isCollapsed={isCollapsed}
          onCollapse={setIsCollapsed}
        />

        <EditFeedModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdateFeed={(oldName, newName, newImage, updatedChannels) =>
            handleUpdateFeed(
              user,
              oldName,
              newName,
              newImage,
              updatedChannels,
              navigate,
              setFeedChannels,
              setChannelDetails,
              setVideos,
              setIsLoading,
              setHasChannels,
              loadChannelDetails,
              setCurrentFeed
            )
          }
          feed={{
            name: feedName,
            image: currentFeed?.image || "",
            channels: Object.entries(feedChannels).map(
              ([channelId, channelTitle]) => ({
                channelId,
                channelTitle,
              })
            ),
          }}
        />

        <SearchPopover
          isOpen={isSearchPopoverOpen}
          onClose={() => setIsSearchPopoverOpen(false)}
          onChannelAdded={handleChannelAdded}
          setIsLoading={setIsLoading}
          setVideos={setVideos}
          setHasChannels={setHasChannels}
          loadChannelDetails={loadChannelDetails}
        />
      </div>
    </div>
  );
}

export default FeedPage;