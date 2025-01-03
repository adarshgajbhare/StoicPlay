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
import { IconChevronLeft, IconChevronsLeft } from "@tabler/icons-react";
import ChannelSidebar from "../components/ChannelSidebar";
import {
  loadFeedData,
  handleChannelDelete,
  handleUpdateFeed,
  handleDeleteFeed,
  handleShareFeed,
} from "../utils/constant";
import {
  IconDotsVertical,
  IconShare,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import DropdownMenu from "../components/DropdownMenu";
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 15)),
    end: new Date(),
  });
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const actionMenuItems = [
    [
      {
        label: "Share",
        icon: <IconShare size={20} />,
        onClick: () => handleShareFeed(user, currentFeed),
      },
      {
        label: "Add Channel",
        icon: <IconPlus size={20} />,
        onClick: () => setIsSearchPopoverOpen(true),
      },
      {
        label: "Edit Feed",
        icon: <IconEdit size={20} />,
        onClick: () => setIsEditModalOpen(true),
      },
      {
        label: "Delete Feed",
        icon: <IconTrash size={20} />,
        onClick: () => handleDeleteFeed(user, feedName, navigate),
        destructive: true,
      },
    ],
  ];
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

  return (
    <div className="min-h-dvh overflow-y-scroll bg-[#121212] text-white p-4">
      <div
        id="feed-side"
        className={`
          ${
            isCollapsed
              ? " max-w-8xl md:pr-16  transition-all duration-300"
              : " max-w-8xl md:pr-64 transition-all duration-300"
          }`}
      >
        <div className="flex justify-between   gap-4 mb-8  ">
          <Link to="/" className="flex items-center">
            <div className="text-white transition-colors duration-500">
              <IconChevronLeft
                size={24}
                strokeWidth={1.5}
                className="scale-125 text-white"
              />
            </div>
            <h1 className="text-2xl/4  font-medium  text-white tracking-tight">
              {feedName}
            </h1>
          </Link>
          <div className="relative">
            <button
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="rounded-full p-2 hover:bg-white/10 transition-colors"
              aria-label="Feed actions"
            >
              <IconDotsVertical size={24} />
            </button>
            <div className="">
              <DropdownMenu
                isOpen={isActionMenuOpen}
                onClose={() => setIsActionMenuOpen(false)}
                items={actionMenuItems}
                position="left"
                width="w-48"
              />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-4 hidden md:block">
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
            <div className="animate-spin rounded-full h-16 w-16 -t-2 -b-2 -white"></div>
          </div>
        ) : !hasChannels ? (
          <EmptyFeedCallToAction />
        ) : isLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-16 w-16 -t-2 -b-2 -white"></div>
          </div>
        ) : (
          // <section className="flex gap-8 lg:px-8">
          //   <div className="max-h-screen relative  w-1/2  p-6 overflow-hidden rounded-2xl">
          //     <div className="absolute inset-0 overflow-hidden size-full bg-gradient-to-t from-[#121212] from-50% via-transparent to-transparent z-30"></div>
          //     <div className="absolute overflow-hidden inset-0 w-full h-full ">
          //       <img
          //       id="cover-image"
          //         src={currentFeed?.image || "/placeholder.png"}
          //         alt=""
          //         className="size-full object-cover object-center"
          //       />
          //     </div>

          //     <div className="absolute inset-0  bg-black/10 filter backdrop-blur-xl"></div>
          //     <div className="mx-auto isolate  cursor-pointer rounded-xl overflow-hidden">
          //       <img
          //         src={currentFeed?.image || "/placeholder.png"}
          //         alt=""
          //       />
          //     </div>
          //   </div>
            <div className="grid   grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id?.videoId || video.id}
                  video={video}
                  channelDetails={video.channelDetails}
                />
              ))}
            </div>
          // </section>
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
