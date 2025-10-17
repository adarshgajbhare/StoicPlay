import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import simpleYouTubeService from '../services/simpleYoutubeService';
import { 
  IconRefresh, 
  IconPlayerPlay, 
  IconLoader2, 
  IconAlertCircle,
  IconBrandYoutube,
  IconArrowLeft,
  IconExternalLink,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX
} from '@tabler/icons-react';
import { toast } from 'react-toastify';

function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelVideos, setChannelVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const subs = await simpleYouTubeService.getUserSubscriptions(user.uid);
      setSubscriptions(subs || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError(error.message);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const searchChannels = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      const results = await simpleYouTubeService.searchChannels(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching channels:', error);
      toast.error('Failed to search channels');
    } finally {
      setSearching(false);
    }
  };

  const addSubscription = async (channel) => {
    try {
      await simpleYouTubeService.addSubscription(user.uid, channel);
      toast.success(`Subscribed to ${channel.title}!`);
      await loadSubscriptions();
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding subscription:', error);
      if (error.message.includes('Already subscribed')) {
        toast.warn('You are already subscribed to this channel');
      } else {
        toast.error('Failed to add subscription');
      }
    }
  };

  const removeSubscription = async (channelId, channelTitle) => {
    try {
      await simpleYouTubeService.removeSubscription(user.uid, channelId);
      toast.success(`Unsubscribed from ${channelTitle}`);
      await loadSubscriptions();
    } catch (error) {
      console.error('Error removing subscription:', error);
      toast.error('Failed to remove subscription');
    }
  };

  const loadChannelVideos = async (channel) => {
    try {
      setLoadingVideos(true);
      setSelectedChannel(channel);
      
      const videos = await simpleYouTubeService.getChannelVideos(channel.channelId);
      setChannelVideos(videos);
    } catch (error) {
      console.error('Error loading channel videos:', error);
      toast.error('Failed to load channel videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  const goBackToSubscriptions = () => {
    setSelectedChannel(null);
    setChannelVideos([]);
  };

  const openVideoInYouTube = (videoId) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const openChannelInYouTube = (channelId) => {
    window.open(`https://www.youtube.com/channel/${channelId}`, '_blank');
  };

  if (loading && !selectedChannel) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-lime-500 mx-auto mb-4" />
          <p className="text-white">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  // Channel Videos View
  if (selectedChannel) {
    return (
      <div className="min-h-screen bg-[#101010] p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={goBackToSubscriptions}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <IconArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <img
              src={selectedChannel.thumbnail}
              alt={selectedChannel.title}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{selectedChannel.title}</h1>
              <button
                onClick={() => openChannelInYouTube(selectedChannel.channelId)}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
              >
                View on YouTube <IconExternalLink className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => removeSubscription(selectedChannel.channelId, selectedChannel.title)}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <IconTrash className="w-4 h-4" />
              Unsubscribe
            </button>
          </div>

          {/* Videos Grid */}
          {loadingVideos ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="w-8 h-8 animate-spin text-lime-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channelVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => openVideoInYouTube(video.id)}
                >
                  <div className="relative group">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <IconPlayerPlay className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-white text-sm line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {channelVideos.length === 0 && !loadingVideos && (
            <div className="text-center py-12">
              <p className="text-gray-400">No recent videos found for this channel.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Subscriptions View
  return (
    <div className="min-h-screen bg-[#101010] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Your Subscriptions</h1>
            <p className="text-gray-400">
              {subscriptions.length} channel{subscriptions.length !== 1 ? 's' : ''} subscribed
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-lime-600 hover:bg-lime-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <IconPlus className="w-4 h-4" />
              Add Channel
            </button>
            <button
              onClick={loadSubscriptions}
              disabled={refreshing}
              className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <IconAlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Subscriptions Grid */}
        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {subscriptions.map((channel) => (
              <div
                key={channel.id}
                className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer group"
              >
                <div className="relative" onClick={() => loadChannelVideos(channel)}>
                  <img
                    src={channel.thumbnail}
                    alt={channel.title}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <IconPlayerPlay className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-white text-sm line-clamp-2 mb-2">
                    {channel.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => openChannelInYouTube(channel.channelId)}
                      className="text-gray-400 hover:text-white text-xs flex items-center gap-1"
                    >
                      <IconExternalLink className="w-3 h-3" />
                      YouTube
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSubscription(channel.id, channel.title);
                      }}
                      className="text-red-400 hover:text-red-300 p-1 rounded"
                      title="Unsubscribe"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <IconBrandYoutube className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Subscriptions Yet</h3>
              <p className="text-gray-400 mb-4">
                Start building your subscription list by adding your favorite channels.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-lime-600 hover:bg-lime-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
              >
                Add Your First Channel
              </button>
            </div>
          )
        )}
      </div>

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Add Channel</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <IconX className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search for channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchChannels()}
                  className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
                <button
                  onClick={searchChannels}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  {searching ? (
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconSearch className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((channel) => (
                      <div key={channel.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <img
                          src={channel.thumbnail}
                          alt={channel.title}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{channel.title}</h3>
                          <p className="text-gray-400 text-sm line-clamp-2">{channel.description}</p>
                        </div>
                        <button
                          onClick={() => addSubscription(channel)}
                          className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm transition-colors"
                        >
                          Subscribe
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  searchQuery && !searching && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No channels found. Try a different search term.</p>
                    </div>
                  )
                )}
                
                {!searchQuery && (
                  <div className="text-center py-8">
                    <IconSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Search for channels to add to your subscriptions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionsPage;