import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import youtubeSubscriptionsFetcher from '../services/youtubeSubscriptionsFetcher';
import { 
  IconRefresh, 
  IconPlayerPlay, 
  IconLoader2, 
  IconAlertCircle,
  IconBrandYoutube,
  IconArrowLeft,
  IconExternalLink,
  IconShieldCheck
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
      checkAccessAndLoadSubscriptions();
    }
  }, [user]);

  const checkAccessAndLoadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has YouTube access
      const hasAccess = await youtubeSubscriptionsFetcher.hasYouTubeAccess(user.uid);
      setHasYouTubeAccess(hasAccess);
      
      if (hasAccess) {
        // Try to load subscriptions
        const subs = await youtubeSubscriptionsFetcher.getUserSubscriptions(user.uid);
        if (subs) {
          setSubscriptions(subs);
        } else {
          setSubscriptions([]);
        }
      } else {
        // Try to load cached subscriptions even without access
        const cached = await youtubeSubscriptionsFetcher.getCachedSubscriptions(user.uid);
        if (cached) {
          setSubscriptions(cached.subscriptions);
        } else {
          setSubscriptions([]);
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
      await youtubeSubscriptionsFetcher.getYouTubeAccess();
      setHasYouTubeAccess(true);
      toast.success('YouTube access granted! Loading your subscriptions...');
      
      // Load fresh subscriptions
      const subs = await youtubeSubscriptionsFetcher.getUserSubscriptions(user.uid, true);
      if (subs) {
        setSubscriptions(subs);
        toast.success(`Loaded ${subs.length} subscriptions!`);
      }
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
      const subs = await youtubeSubscriptionsFetcher.getUserSubscriptions(user.uid, true);
      if (subs) {
        setSubscriptions(subs);
        toast.success(`Refreshed ${subs.length} subscriptions!`);
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
      
      const accessToken = await youtubeSubscriptionsFetcher.getStoredAccessToken(user.uid);
      if (!accessToken) {
        toast.error('Please reconnect to YouTube to view channel videos');
        return;
      }
      
      const videos = await youtubeSubscriptionsFetcher.fetchChannelVideos(
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
          <p className="text-gray-400 mb-6">
            To view your YouTube subscriptions, we need access to your YouTube data.
          </p>
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <IconShieldCheck className="w-5 h-5 text-green-500" />
              <span className="text-white font-medium">Safe & Secure</span>
            </div>
            <ul className="text-left text-gray-400 text-sm space-y-2">
              <li>• Read-only access to your subscriptions</li>
              <li>• We never access private data</li>
              <li>• You can revoke access anytime</li>
              <li>• No additional login required</li>
            </ul>
          </div>
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
            {loading ? 'Connecting...' : 'Connect YouTube Account'}
          </button>
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
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiM0QjU1NjMiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBzdHlsZT0idHJhbnNmb3JtOiB0cmFuc2xhdGUoMTBweCwgMTBweCkiPgo8cGF0aCBkPSJNMTAgMTBDMTEuMTA0NiAxMCAxMiA5LjEwNDU3IDEyIDhDMTIgNi44OTU0MyAxMS4xMDQ2IDYgMTAgNkM4Ljg5NTQzIDYgOCA2Ljg5NTQzIDggOEM4IDkuMTA0NTcgOC44OTU0MyAxMCAxMCAxMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMCAxMkM3LjMzNTMzIDEyIDYuNzMxMTYgMTQuMDI0MSA2LjEyMzc5IDE1Ljk5NzJDNi4wMzc2NiAxNi4yNzM0IDYuMjQ3NDQgMTYuNTMzMyA2LjU0NjggMTYuNTMzM0gxMy40NTMyQzEzLjc1MjYgMTYuNTMzMyAxMy45NjI0IDE2LjI3MzQgMTMuODc2MiAxNS45OTcyQzEzLjI2ODggMTQuMDI0MSAxMi42NjQ3IDEyIDEwIDEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';
              }}
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
              <div className="text-center">
                <IconLoader2 className="w-8 h-8 animate-spin text-lime-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading latest videos...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channelVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer group"
                  onClick={() => openVideoInYouTube(video.id)}
                >
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxzdmcgeD0iMTQwIiB5PSI3MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiPgo8cGF0aCBkPSJNOCAxNUwxNiA5VjE1SDE0VjExTDEwIDE1SDhaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo8L3N2Zz4K';
                      }}
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
            <h1 className="text-2xl font-bold text-white mb-2">Your YouTube Subscriptions</h1>
            <p className="text-gray-400">
              {subscriptions.length} channel{subscriptions.length !== 1 ? 's' : ''} subscribed
              {!hasYouTubeAccess && subscriptions.length > 0 && (
                <span className="ml-2 text-yellow-400">(cached data)</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {hasYouTubeAccess ? (
              <button
                onClick={refreshSubscriptions}
                disabled={refreshing}
                className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            ) : (
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
                className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer group"
                onClick={() => loadChannelVideos(channel)}
              >
                <div className="relative">
                  <img
                    src={channel.thumbnail}
                    alt={channel.title}
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjNEI1NTYzIi8+CjxzdmcgeD0iOTAiIHk9IjkwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMCAxMEMxMS4xMDQ2IDEwIDEyIDkuMTA0NTcgMTIgOEMxMiA2Ljg5NTQzIDExLjEwNDYgNiAxMCA2QzguODk1NDMgNiA4IDYuODk1NDMgOCA4QzggOS4xMDQ1NyA4Ljg5NTQzIDEwIDEwIDEwWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEwIDEyQzcuMzM1MzMgMTIgNi43MzExNiAxNC4wMjQxIDYuMTIzNzkgMTUuOTk3MkM2LjAzNzY2IDE2LjI3MzQgNi4yNDc0NCAxNi41MzMzIDYuNTQ2OCAxNi41MzMzSDEzLjQ1MzJDMTMuNzUyNiAxNi41MzMzIDEzLjk2MjQgMTYuMjczNCAxMy44NzYyIDE1Ljk5NzJDMTMuMjY4OCAxNC4wMjQxIDEyLjY2NDcgMTIgMTAgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+Cg==';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <IconPlayerPlay className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-white text-sm line-clamp-2 mb-1">
                    {channel.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openChannelInYouTube(channel.channelId);
                    }}
                    className="text-gray-400 hover:text-white text-xs flex items-center gap-1"
                  >
                    <IconExternalLink className="w-3 h-3" />
                    View on YouTube
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <IconBrandYoutube className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                {hasYouTubeAccess ? 'No Subscriptions Found' : 'Connect YouTube to View Subscriptions'}
              </h3>
              <p className="text-gray-400 mb-4">
                {hasYouTubeAccess 
                  ? "You don't seem to have any YouTube subscriptions." 
                  : "Connect your YouTube account to see all your subscribed channels."
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