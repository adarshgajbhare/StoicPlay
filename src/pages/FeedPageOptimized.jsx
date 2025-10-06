import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../contexts/AuthContext";

// Redux actions and selectors
import {
  fetchFeedVideos,
  checkForNewVideos,
  markNewVideosSeen,
  selectFeedVideos,
  selectFeedChannels,
  selectFeedLoading,
  selectFeedError,
  selectNewVideoCount,
  selectChannelDetails
} from "../store/videoCacheSlice";

// Components
import EditFeedModal from "../components/EditFeedModal";
import EmptyFeedCallToAction from "../components/EmptyFeedCallToAction";
import SearchPopover from "../components/SearchPopover";
import ChannelSidebar from "../components/ChannelSidebar";
import FilterTags from "../components/FilterTags";
import VideoCard from "../components/VideoCard";

// Icons
import { IconChevronLeft, IconPlus, IconEdit, IconRefresh } from "@tabler/icons-react";

// Utils
import {
  loadFeedData,
  handleChannelDelete,
  handleUpdateFeed,
} from "../utils/constant";

// Memoized VideoCard for performance
const MemoizedVideoCard = React.memo(VideoCard, (prevProps, nextProps) => {
  // Custom comparison for video cards
  return (
    prevProps.video?.id === nextProps.video?.id &&
    prevProps.video?.snippet?.publishedAt === nextProps.video?.snippet?.publishedAt &&
    prevProps.channelDetails?.id === nextProps.channelDetails?.id
  );
});

// Memoized video list component
const VideoList = React.memo(({ videos, channelDetails, gridColumns }) => {
  return (
    <div className={`grid ${gridColumns} gap-6 md:p-4 p-0 transition-all duration-300`}>
      {videos.map((video) => {
        const videoId = video.id?.videoId || video.snippet?.resourceId?.videoId || video.id;
        const channelId = video.snippet?.channelId;
        const videoChannelDetails = channelDetails[channelId] || video.channelDetails;
        
        return (
          <MemoizedVideoCard
            key={videoId}
            video={video}
            channelDetails={videoChannelDetails}
          />
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.videos.length === nextProps.videos.length &&
    prevProps.gridColumns === nextProps.gridColumns &&
    prevProps.videos[0]?.id === nextProps.videos[0]?.id
  );
});

function FeedPageOptimized() {
  const { user } = useAuth();
  const { feedName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const videos = useSelector(state => selectFeedVideos(state, feedName));
  const channels = useSelector(state => selectFeedChannels(state, feedName));
  const isLoading = useSelector(state => selectFeedLoading(state, feedName));
  const error = useSelector(state => selectFeedError(state, feedName));
  const newVideoCount = useSelector(state => selectNewVideoCount(state, feedName));
  
  // Local state
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [feedChannels, setFeedChannels] = useState({});
  const [currentFeed, setCurrentFeed] = useState(null);
  const [hasChannels, setHasChannels] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // UI state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);
  
  // Memoized channel details map
  const channelDetailsMap = useSelector(state => {
    const details = {};
    Object.keys(feedChannels).forEach(channelId => {
      details[channelId] = selectChannelDetails(state, channelId);
    });
    return details;
  });
  
  // Filtered videos based on selected channel
  const filteredVideos = useMemo(() => {
    if (!selectedChannel || !videos.length) return videos;
    return videos.filter(video => video.snippet?.channelId === selectedChannel);
  }, [selectedChannel, videos]);
  
  // Memoized grid columns calculation
  const gridColumns = useMemo(() => {
    if (isCollapsed && isLeftSidebarCollapsed) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
    } else if (!isCollapsed && !isLeftSidebarCollapsed) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    } else {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    }
  }, [isCollapsed, isLeftSidebarCollapsed]);
  
  // Load feed data on mount
  useEffect(() => {
    if (!user || !feedName) return;
    
    loadFeedData(
      user,
      feedName,
      setCurrentFeed,
      setFeedChannels,
      setHasChannels,
      setInitialLoad
    );
  }, [feedName, user]);
  
  // Fetch videos when channels are loaded
  useEffect(() => {
    if (!hasChannels || !Object.keys(feedChannels).length) {
      setInitialLoad(false);
      return;
    }
    
    const channelIds = Object.keys(feedChannels);
    
    // Dispatch Redux action to fetch videos
    dispatch(fetchFeedVideos({ 
      channelIds, 
      feedName,
      forceRefresh: false 
    })).finally(() => {
      setInitialLoad(false);
    });
  }, [dispatch, feedName, feedChannels, hasChannels]);
  
  // Auto-refresh mechanism
  useEffect(() => {
    if (!hasChannels || !Object.keys(feedChannels).length) return;
    
    const interval = setInterval(() => {
      const channelIds = Object.keys(feedChannels);
      dispatch(checkForNewVideos({ channelIds, feedName }));
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, [dispatch, feedName, feedChannels, hasChannels]);
  
  // Mark new videos as seen when component mounts
  useEffect(() => {
    if (newVideoCount > 0) {
      const timer = setTimeout(() => {
        dispatch(markNewVideosSeen(feedName));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [dispatch, feedName, newVideoCount]);
  
  // Left sidebar state listener
  useEffect(() => {
    const handleLeftSidebar = (e) => {
      if (e.detail) {
        setIsLeftSidebarCollapsed(e.detail.isCollapsed);
      }
    };
    
    window.addEventListener('leftSidebarStateChange', handleLeftSidebar);
    return () => window.removeEventListener('leftSidebarStateChange', handleLeftSidebar);
  }, []);
  
  // Optimized handlers
  const handleChannelAdded = useCallback(() => {
    // Reset local state
    setFeedChannels({});
    setInitialLoad(true);
    
    // Reload feed data
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
  }, [user, feedName]);
  
  const handleRefresh = useCallback(() => {
    if (Date.now() - lastRefresh < 30000) return; // Throttle refreshes
    
    setLastRefresh(Date.now());
    const channelIds = Object.keys(feedChannels);
    
    if (channelIds.length > 0) {
      dispatch(fetchFeedVideos({ 
        channelIds, 
        feedName, 
        forceRefresh: true 
      }));
    }
  }, [dispatch, feedName, feedChannels, lastRefresh]);
  
  const handleChannelSelect = useCallback((channelId) => {
    setSelectedChannel(channelId);
  }, []);
  
  const handleChannelDeleteCallback = useCallback((channelIdToDelete) => {
    handleChannelDelete(
      user,
      feedName,
      channelIdToDelete,
      selectedChannel,
      setSelectedChannel,
      () => {
        loadFeedData(
          user,
          feedName,
          setCurrentFeed,
          setFeedChannels,
          setHasChannels,
          setInitialLoad
        );
      }
    );
  }, [user, feedName, selectedChannel]);
  
  const handleUpdateFeedCallback = useCallback((oldName, newName, newImage, updatedChannels) => {
    handleUpdateFeed(
      user,
      oldName,
      newName,
      newImage,
      updatedChannels,
      navigate,
      setFeedChannels,
      () => {}, // channelDetails setter not needed with Redux
      () => {}, // videos setter not needed with Redux
      () => {}, // loading setter not needed with Redux
      setHasChannels,
      () => {}, // loadChannelDetails not needed with Redux
      setCurrentFeed
    );
  }, [user, navigate]);
  
  // Loading state
  if (initialLoad) {
    return (
      <div className="w-full min-h-dvh rounded-2xl p-4 bg-[#101010] flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
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
        {/* Header */}
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
              {newVideoCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {newVideoCount}
                </span>
              )}
            </h1>
          </Link>
          
          <div className="flex space-x-2">
            {hasChannels && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="hover:bg-white hover:text-black flex items-center bg-white/10 text-white p-3 rounded-full ml-1 md:inline disabled:opacity-50"
                aria-label="Refresh Feed"
              >
                <IconRefresh size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
            <button
              onClick={() => setIsSearchPopoverOpen(true)}
              className="hover:bg-white hover:text-black flex items-center bg-white/10 text-white p-3 rounded-full ml-1 md:inline"
              aria-label="Add Channel"
            >
              <IconPlus size={20} />
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="hover:bg-white hover:text-black flex items-center bg-white/10 text-white p-3 rounded-full ml-1 md:inline"
              aria-label="Edit Feed"
            >
              <IconEdit size={20} />
            </button>
          </div>
        </div>
        
        {/* Subtitle */}
        <p className={`text-base text-white text md:font-2xl mb-4 ${!hasChannels ? "hidden" : " md:block"}`}>
          {selectedChannel
            ? `Videos from ${feedChannels[selectedChannel]}`
            : "All Videos"}
        </p>
        
        {/* Error state */}
        {error && (
          <div className="bg-red-600/20 border border-red-600/40 text-red-400 px-4 py-2 rounded-lg mb-4">
            Error: {error}
          </div>
        )}
        
        {/* Filter tags */}
        {hasChannels && (
          <FilterTags
            channels={feedChannels}
            channelDetails={channelDetailsMap}
            selectedChannel={selectedChannel}
            onChannelSelect={handleChannelSelect}
            onChannelDelete={handleChannelDeleteCallback}
            videos={filteredVideos}
          />
        )}
        
        {/* Content */}
        {!hasChannels ? (
          <EmptyFeedCallToAction />
        ) : isLoading && videos.length === 0 ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <VideoList 
            videos={filteredVideos} 
            channelDetails={channelDetailsMap} 
            gridColumns={gridColumns}
          />
        )}
        
        {/* Channel Sidebar */}
        {hasChannels && (
          <ChannelSidebar
            channels={feedChannels}
            channelDetails={channelDetailsMap}
            selectedChannel={selectedChannel}
            onChannelSelect={handleChannelSelect}
            onChannelDelete={handleChannelDeleteCallback}
            totalVideosCount={filteredVideos.length}
            videos={filteredVideos}
            isCollapsed={isCollapsed}
            onCollapse={setIsCollapsed}
          />
        )}
        
        {/* Modals */}
        <EditFeedModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdateFeed={handleUpdateFeedCallback}
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
          setIsLoading={() => {}} // Redux handles loading state
          setVideos={() => {}} // Redux handles videos state
          setHasChannels={setHasChannels}
          loadChannelDetails={() => {}} // Redux handles channel details
        />
      </div>
    </div>
  );
}

export default React.memo(FeedPageOptimized);