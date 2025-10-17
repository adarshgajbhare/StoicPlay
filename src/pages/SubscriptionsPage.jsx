import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import youtubeSubscriptionsService from '../services/youtubeSubscriptionsService';
import { 
  IconRefresh, 
  IconPlayerPlay, 
  IconLoader2, 
  IconAlertCircle,
  IconBrandYoutube,
  IconArrowLeft,
  IconExternalLink
} from '@tabler/icons-react';
import { toast } from 'react-toastify';

function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasYouTubeAccess, setHasYouTubeAccess] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelVideos, setChannelVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has YouTube access
      const hasAccess = await youtubeSubscriptionsService.hasYouTubeAccess(user.uid);
      setHasYouTubeAccess(hasAccess);
      
      if (hasAccess) {
        const subs = await youtubeSubscriptionsService.getUserSubscriptions(user.uid);
        if (subs) {
          setSubscriptions(subs);
        }
      } else {
        // Try to get cached subscriptions
        const cached = await youtubeSubscriptionsService.getCachedSubscriptions(user.uid);
        if (cached) {
          setSubscriptions(cached.subscriptions);
        }
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError(error.message);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const requestYouTubeAccess = async () => {
    try {
      setLoading(true);
      await youtubeSubscriptionsService.requestYouTubeAccess();
      setHasYouTubeAccess(true);
      toast.success('YouTube access granted!');
      await loadSubscriptions();
    } catch (error) {
      console.error('Error requesting YouTube access:', error);
      toast.error('Failed to connect to YouTube. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptions = async () => {
    try {
      setRefreshing(true);
      const subs = await youtubeSubscriptionsService.getUserSubscriptions(user.uid, true);
      if (subs) {
        setSubscriptions(subs);
        toast.success('Subscriptions refreshed!');
      }
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
      toast.error('Failed to refresh subscriptions');
    } finally {
      setRefreshing(false);
    }
  };

  const loadChannelVideos = async (channel) => {
    try {
      setLoadingVideos(true);
      setSelectedChannel(channel);
      
      const accessToken = await youtubeSubscriptionsService.getUserAccessToken(user.uid);
      if (!accessToken) {
        toast.error('Please reconnect to YouTube to view channel videos');
        return;
      }
      
      const videos = await youtubeSubscriptionsService.fetchChannelVideos(
        channel.channelId, 
        accessToken
      );
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

  // YouTube Access Required Screen
  if (!hasYouTubeAccess && subscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <IconBrandYoutube className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your YouTube Account
          </h2>
          <p className="text-gray-400 mb-8">
            To view your YouTube subscriptions, we need permission to access your YouTube account data.
          </p>
          <button
            onClick={requestYouTubeAccess}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <IconLoader2 className="w-5 h-5 animate-spin" />
            ) : (
              <IconBrandYoutube className="w-5 h-5" />
            )}
            Connect YouTube Account
          </button>
          <p className="text-xs text-gray-500 mt-4">
            We only request read-only access to your subscriptions
          </p>
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
            {hasYouTubeAccess && (
              <button
                onClick={refreshSubscriptions}
                disabled={refreshing}
                className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            {!hasYouTubeAccess && (
              <button
                onClick={requestYouTubeAccess}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <IconBrandYoutube className="w-4 h-4" />
                Connect YouTube
              </button>
            )}
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
                className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => loadChannelVideos(channel)}
              >
                <div className="relative group">
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
                  <h3 className="font-medium text-white text-sm line-clamp-2">
                    {channel.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <IconBrandYoutube className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Subscriptions Found</h3>
              <p className="text-gray-400 mb-4">
                {hasYouTubeAccess 
                  ? "You don't seem to have any YouTube subscriptions." 
                  : "Connect your YouTube account to view your subscriptions."
                }
              </p>
              {!hasYouTubeAccess && (
                <button
                  onClick={requestYouTubeAccess}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                >
                  Connect YouTube Account
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default SubscriptionsPage;