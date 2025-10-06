/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import VideoCard from './VideoCard';

/**
 * VirtualizedVideoGrid - Renders only visible video cards to optimize performance
 * for large video collections
 */
function VirtualizedVideoGrid({ 
  videos = [], 
  channelDetailsMap = new Map(),
  onVideoRemoved,
  className = '',
  cardHeight = 320, // Approximate height of a video card
  cardWidth = 300, // Approximate width of a video card
  gap = 16, // Gap between cards
  overscan = 5 // Number of items to render outside visible area
}) {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate grid dimensions
  const gridMetrics = useMemo(() => {
    if (containerDimensions.width === 0) return { columns: 1, rows: 1, totalHeight: 0 };
    
    const availableWidth = containerDimensions.width - gap;
    const columns = Math.max(1, Math.floor(availableWidth / (cardWidth + gap)));
    const rows = Math.ceil(videos.length / columns);
    const totalHeight = rows * (cardHeight + gap) - gap;
    
    return { columns, rows, totalHeight };
  }, [containerDimensions.width, videos.length, cardHeight, cardWidth, gap]);

  // Calculate which items should be visible
  const visibleItems = useMemo(() => {
    const { columns } = gridMetrics;
    const rowHeight = cardHeight + gap;
    
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      gridMetrics.rows,
      Math.ceil((scrollTop + containerDimensions.height) / rowHeight) + overscan
    );
    
    const start = startRow * columns;
    const end = Math.min(videos.length, endRow * columns);
    
    return { start, end, startRow, endRow };
  }, [scrollTop, containerDimensions.height, gridMetrics, overscan, videos.length, cardHeight, gap]);

  // Update visible range when calculated range changes
  useEffect(() => {
    setVisibleRange({ start: visibleItems.start, end: visibleItems.end });
  }, [visibleItems.start, visibleItems.end]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Throttled scroll handler
  const throttledScrollHandler = useMemo(() => {
    let timeoutId;
    return (e) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleScroll(e), 16); // ~60fps
    };
  }, [handleScroll]);

  // Get position for an item
  const getItemPosition = useCallback((index) => {
    const { columns } = gridMetrics;
    const row = Math.floor(index / columns);
    const col = index % columns;
    const rowHeight = cardHeight + gap;
    const colWidth = cardWidth + gap;
    
    return {
      top: row * rowHeight,
      left: col * colWidth,
      width: cardWidth,
      height: cardHeight
    };
  }, [gridMetrics, cardHeight, cardWidth, gap]);

  // Render visible items
  const renderVisibleItems = () => {
    if (!videos.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <span>No videos to display</span>
        </div>
      );
    }

    const items = [];
    
    for (let i = visibleRange.start; i < visibleRange.end && i < videos.length; i++) {
      const video = videos[i];
      const position = getItemPosition(i);
      const channelDetails = channelDetailsMap.get(video.snippet?.channelId);
      
      items.push(
        <div
          key={video.id?.videoId || video.snippet?.resourceId?.videoId || video.id || i}
          className="absolute"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            height: position.height
          }}
        >
          <VideoCard
            video={video}
            channelDetails={channelDetails}
            onVideoRemoved={onVideoRemoved}
          />
        </div>
      );
    }
    
    return items;
  };

  // Loading state
  if (videos.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onScroll={throttledScrollHandler}
      style={{ height: '100%' }}
    >
      {/* Spacer to maintain scroll height */}
      <div 
        style={{ 
          height: gridMetrics.totalHeight,
          width: '100%',
          position: 'relative'
        }}
      >
        {renderVisibleItems()}
      </div>
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 p-2 rounded text-xs text-white z-50">
          <div>Total: {videos.length}</div>
          <div>Visible: {visibleRange.start}-{visibleRange.end}</div>
          <div>Cols: {gridMetrics.columns}</div>
          <div>Scroll: {Math.round(scrollTop)}</div>
        </div>
      )}
    </div>
  );
}

export default React.memo(VirtualizedVideoGrid);
