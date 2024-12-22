import React from 'react';
import ChannelCard from './ChannelCard';

function ChannelGrid({ channels, onAddChannel }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id.channelId}
          channel={channel}
          onAddChannel={onAddChannel}
        />
      ))}
    </div>
  );
}

export default ChannelGrid;

