import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import VideoCard from "../components/VideoCard";
import EditFeedModal from "../components/EditFeedModal";
import {
  fetchChannelVideos,
  fetchChannelDetails,
} from "../services/youtubeApi";
import { useAuth } from "../contexts/AuthContext";
import EmptyFeedCallToAction from "../components/EmptyFeedCallToAction";
import SearchPopover from "../components/SearchPopover";
import { IconChevronLeft, IconPlus, IconEdit, IconEditCircle } from "@tabler/icons-react";
import ChannelSidebar from "../components/ChannelSidebar";
import {
  loadFeedData,
  handleChannelDelete,
  handleUpdateFeed,
} from "../utils/constant";
import FilterTags from "../components/FilterTags";

function FeedPage() {
  const { user } = useAuth();
  const { feedName } = useParams();
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChannels, setHasChannels] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [feedChannels, setFeedChannels] = useState({});
  const [channelDetails, setChannelDetails] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [currentFeed, setCurrentFeed] = useState(null);
  const [currentDateRange, setCurrentDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 15)),
    end: new Date(),
  });
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
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
    loadFeedVideos(details);
  };

  const loadFeedVideos = async (channelDetailsMap, loadMore = false) => {
    setIsLoading(true);
    try {
      let allVideos = loadMore ? [...videos] : [];

      for (const channelId in feedChannels) {
        try {
          const channelVideos = await fetchChannelVideos(channelId);
          if (Array.isArray(channelVideos)) {
            channelVideos.forEach((video) => {
              const publishedDate = new Date(video.snippet?.publishedAt);
              if (
                publishedDate >= currentDateRange.start &&
                publishedDate <= currentDateRange.end
              ) {
                video.channelDetails = channelDetailsMap[channelId];
                allVideos.push(video);
              }
            });
          }
        } catch (error) {
          console.error(
            `Error fetching videos for channel ${channelId}:`,
            error
          );
        }
      }

      allVideos.sort(
        (a, b) =>
          new Date(b.snippet?.publishedAt || 0) -
          new Date(a.snippet?.publishedAt || 0)
      );

      setVideos(allVideos);
      setHasMoreVideos(allVideos.length > 0);
    } catch (error) {
      console.error("Error loading feed videos:", error);
      setVideos([]);
    } finally {
      setIsLoading(false);
      setInitialLoad(false);
    }
  };

  const handleChannelAdded = () => {
    setFeedChannels({});
    setChannelDetails({});
    setVideos([]);
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
      className={`w-full ${!hasChannels ? 'h-[700px] overflow-hidden' : 'min-h-dvh'} rounded-2xl p-0 md:p-4 bg-[#101010] popover md:shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]`}
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
        <h2 className={`text-2xl text-white font-medium mb-4 ${!hasChannels ? "hidden" :" md:block"} `}>
          {selectedChannel
            ? `Videos from ${feedChannels[selectedChannel]}`
            : "All Videos"}
        </h2>

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
          <div className={`grid ${getGridColumns()} gap-6 p-4 transition-all duration-300`}>
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id?.videoId || video.id}
                video={video}
                channelDetails={video.channelDetails}
              />
            ))}
          </div>
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

