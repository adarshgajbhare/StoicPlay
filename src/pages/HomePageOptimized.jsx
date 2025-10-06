import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../contexts/AuthContext";
import { fetchFeeds, addFeed, deleteFeeds, shareFeeds } from "../store/feedsSlice";
import { clearFeedCache } from "../store/videoCacheSlice";

// Components
import FeedCard from "../components/FeedCard";
import AddFeedModal from "../components/AddFeedModal";
import ShareModal from "../components/ShareModal";
import SelectionBar from "../components/SelectionBar";
import EmptyState from "../components/EmptyState";

// Icons
import { IconPlus, IconShare, IconTrash, IconRefresh } from "@tabler/icons-react";

// Optimized FeedCard with React.memo
const MemoizedFeedCard = React.memo(FeedCard, (prevProps, nextProps) => {
  return (
    prevProps.feed?.id === nextProps.feed?.id &&
    prevProps.feed?.name === nextProps.feed?.name &&
    prevProps.feed?.image === nextProps.feed?.image &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectionMode === nextProps.isSelectionMode
  );
});

// Optimized feed grid component
const FeedGrid = React.memo(({ 
  feeds, 
  selectedFeeds, 
  isSelectionMode, 
  onFeedSelect, 
  onToggleSelection 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {feeds.map((feed) => (
        <MemoizedFeedCard
          key={feed.id || feed.name}
          feed={feed}
          isSelected={selectedFeeds.has(feed.name)}
          isSelectionMode={isSelectionMode}
          onToggleSelection={() => onToggleSelection(feed.name)}
          onClick={() => onFeedSelect(feed)}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.feeds.length === nextProps.feeds.length &&
    prevProps.isSelectionMode === nextProps.isSelectionMode &&
    prevProps.selectedFeeds.size === nextProps.selectedFeeds.size &&
    prevProps.feeds[0]?.name === nextProps.feeds[0]?.name
  );
});

function HomePageOptimized() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  
  // Redux state
  const { items: feeds, isLoading, error } = useSelector(state => state.feeds);
  
  // Local state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFeeds, setSelectedFeeds] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  
  // Memoized computed values
  const selectedFeedsList = useMemo(() => {
    return Array.from(selectedFeeds);
  }, [selectedFeeds]);
  
  const selectedFeedsData = useMemo(() => {
    return feeds.filter(feed => selectedFeeds.has(feed.name));
  }, [feeds, selectedFeeds]);
  
  const hasSelectedFeeds = selectedFeeds.size > 0;
  
  // Load feeds on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchFeeds(user));
    }
  }, [dispatch, user]);
  
  // Optimized handlers with useCallback
  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefresh < 10000 || isLoading) return; // 10 second throttle
    
    setLastRefresh(now);
    if (user) {
      await dispatch(fetchFeeds(user));
    }
  }, [dispatch, user, isLoading, lastRefresh]);
  
  const handleAddFeed = useCallback(async (feedName, imageFile) => {
    if (!user) return;
    
    try {
      await dispatch(addFeed({ user, feedName, imageFile })).unwrap();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding feed:', error);
      throw error; // Re-throw for modal to handle
    }
  }, [dispatch, user]);
  
  const handleDeleteSelected = useCallback(async () => {
    if (!user || !hasSelectedFeeds) return;
    
    try {
      await dispatch(deleteFeeds({ 
        user, 
        feedNames: selectedFeedsList 
      })).unwrap();
      
      // Clear cache for deleted feeds
      selectedFeedsList.forEach(feedName => {
        dispatch(clearFeedCache(feedName));
      });
      
      setSelectedFeeds(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error deleting feeds:', error);
    }
  }, [dispatch, user, selectedFeedsList, hasSelectedFeeds]);
  
  const handleShareSelected = useCallback(async () => {
    if (!user || !hasSelectedFeeds) return;
    
    try {
      await dispatch(shareFeeds({ 
        user, 
        feedNames: selectedFeedsList,
        feeds: selectedFeedsData
      })).unwrap();
      
      setIsShareModalOpen(true);
    } catch (error) {
      console.error('Error sharing feeds:', error);
    }
  }, [dispatch, user, selectedFeedsList, selectedFeedsData, hasSelectedFeeds]);
  
  const handleFeedSelect = useCallback((feed) => {
    if (isSelectionMode) {
      handleToggleSelection(feed.name);
    } else {
      // Navigate to feed (implement navigation logic)
      window.location.href = `/feed/${encodeURIComponent(feed.name)}`;
    }
  }, [isSelectionMode]);
  
  const handleToggleSelection = useCallback((feedName) => {
    setSelectedFeeds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feedName)) {
        newSet.delete(feedName);
      } else {
        newSet.add(feedName);
      }
      
      // Exit selection mode if no items selected
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      
      return newSet;
    });
  }, []);
  
  const handleLongPress = useCallback((feedName) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedFeeds(new Set([feedName]));
    }
  }, [isSelectionMode]);
  
  const handleSelectAll = useCallback(() => {
    if (selectedFeeds.size === feeds.length) {
      // Deselect all
      setSelectedFeeds(new Set());
      setIsSelectionMode(false);
    } else {
      // Select all
      setSelectedFeeds(new Set(feeds.map(feed => feed.name)));
    }
  }, [feeds, selectedFeeds.size]);
  
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedFeeds(new Set());
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault();
            if (feeds.length > 0) {
              setIsSelectionMode(true);
              handleSelectAll();
            }
            break;
          case 'r':
            event.preventDefault();
            handleRefresh();
            break;
          case 'n':
            event.preventDefault();
            setIsAddModalOpen(true);
            break;
        }
      } else if (event.key === 'Escape') {
        exitSelectionMode();
      } else if (event.key === 'Delete' && hasSelectedFeeds) {
        handleDeleteSelected();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feeds.length, hasSelectedFeeds, handleSelectAll, handleRefresh, handleDeleteSelected, exitSelectionMode]);
  
  // Loading state
  if (isLoading && feeds.length === 0) {
    return (
      <div className="w-full min-h-dvh rounded-2xl p-4 bg-[#101010] flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  return (
    <div className="w-full min-h-dvh rounded-2xl p-4 bg-[#101010] popover md:shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Your Feeds
          </h1>
          {isLoading && (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white/50"></div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="hover:bg-white hover:text-black flex items-center bg-white/10 text-white p-3 rounded-full transition-colors disabled:opacity-50"
            aria-label="Refresh Feeds"
            title="Refresh (Ctrl+R)"
          >
            <IconRefresh size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hover:bg-white hover:text-black flex items-center bg-white/10 text-white p-3 rounded-full transition-colors"
            aria-label="Add Feed"
            title="Add Feed (Ctrl+N)"
          >
            <IconPlus size={20} />
          </button>
        </div>
      </div>
      
      {/* Selection Bar */}
      {isSelectionMode && (
        <SelectionBar
          selectedCount={selectedFeeds.size}
          totalCount={feeds.length}
          onSelectAll={handleSelectAll}
          onDelete={handleDeleteSelected}
          onShare={handleShareSelected}
          onCancel={exitSelectionMode}
          isAllSelected={selectedFeeds.size === feeds.length}
        />
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-600/20 border border-red-600/40 text-red-400 px-4 py-3 rounded-lg mb-4">
          <p className="font-medium">Error loading feeds</p>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      )}
      
      {/* Content */}
      {feeds.length === 0 && !isLoading ? (
        <EmptyState 
          title="No feeds yet"
          description="Create your first feed to start organizing your YouTube subscriptions"
          actionText="Create Feed"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <FeedGrid
          feeds={feeds}
          selectedFeeds={selectedFeeds}
          isSelectionMode={isSelectionMode}
          onFeedSelect={handleFeedSelect}
          onToggleSelection={handleToggleSelection}
        />
      )}
      
      {/* Stats */}
      {feeds.length > 0 && (
        <div className="mt-6 text-center text-white/60 text-sm">
          {feeds.length} feed{feeds.length !== 1 ? 's' : ''} total
          {hasSelectedFeeds && (
            <span className="ml-2">
              • {selectedFeeds.size} selected
            </span>
          )}
        </div>
      )}
      
      {/* Modals */}
      <AddFeedModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFeed={handleAddFeed}
        existingFeedNames={feeds.map(feed => feed.name)}
      />
      
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        selectedFeeds={selectedFeedsData}
      />
      
      {/* Keyboard shortcuts hint */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white/60 text-xs p-2 rounded">
          <div>Ctrl+A: Select All</div>
          <div>Ctrl+R: Refresh</div>
          <div>Ctrl+N: New Feed</div>
          <div>Del: Delete Selected</div>
          <div>Esc: Cancel Selection</div>
        </div>
      )}
    </div>
  );
}

export default React.memo(HomePageOptimized);