/* eslint-disable no-unused-vars */
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  setDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { compressImage } from "./imageUtils";
import { fetchPlaylistDetails } from "../services/youtubeApi";
import { createSharedFeed } from "../services/shareService";

// HomePage Methods
export const handleFeedImage = async (file) => {
  if (!file) return "/default-thumb.webp";
  
  try {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return "/default-thumb.webp";
  }
};

export const loadHomeFeeds = async (user, setFeeds) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      setFeeds(userDocSnap.data().feeds || []);
    } else {
      console.log("No such document! Creating a new one...");
      setFeeds([]);
    }
  }
};

export const handleAddHomeFeed = async (user, feeds, setFeeds, feedName, imageFile) => {
  try {
    let imageUrl = "/default-thumb.webp";
    
    if (imageFile) {
      try {
        const compressedBlob = await compressImage(imageFile);
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(compressedBlob);
        });
      } catch (error) {
        console.error("Error processing image:", error);
      }
    }

    const newFeed = { 
      name: feedName, 
      image: imageUrl, 
      channels: [] 
    };

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      await updateDoc(userDocRef, {
        feeds: arrayUnion(newFeed)
      });
    } else {
      await setDoc(userDocRef, {
        feeds: [newFeed]
      });
    }

    setFeeds([...feeds, newFeed]);
  } catch (error) {
    console.error("Error adding feed:", error);
    throw error;
  }
};

export const handleUpdateHomeFeed = async (user, feeds, setFeeds, oldName, newName, newImageUrl) => {
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const updatedFeeds = feeds.map((feed) =>
      feed?.name === oldName
        ? { ...feed, name: newName, image: newImageUrl }
        : feed
    );
    const oldFeed = feeds.find((feed) => feed?.name === oldName);
    const newFeed = updatedFeeds.find((feed) => feed?.name === newName);

    await updateDoc(userDocRef, {
      feeds: arrayRemove(oldFeed),
    });
    await updateDoc(userDocRef, {
      feeds: arrayUnion(newFeed),
    });

    setFeeds(updatedFeeds);
  }
};





// FeedPage Methods
export const loadFeedData = async (user, feedName, setCurrentFeed, setFeedChannels, setHasChannels, setInitialLoad) => {
  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const thisFeed = userData.feeds.find((feed) => feed.name === feedName);
        if (thisFeed) {
          setCurrentFeed(thisFeed);
          setFeedChannels(
            thisFeed.channels.reduce((acc, channel) => {
              acc[channel.channelId] = channel.channelTitle;
              return acc;
            }, {})
          );
          setHasChannels(thisFeed.channels.length > 0);
        } else {
          setFeedChannels({});
          setHasChannels(false);
          setInitialLoad(false);
        }
      } else {
        console.log("No such document!");
        setFeedChannels({});
        setHasChannels(false);
        setInitialLoad(false);
      }
    } catch (error) {
      console.error("Error loading feed data:", error);
      setFeedChannels({});
      setHasChannels(false);
      setInitialLoad(false);
    }
  }
};

export const handleChannelDelete = async (user, feedName, channelIdToDelete, selectedChannel, setSelectedChannel, loadFeedData) => {
  if (!window.confirm("Are you sure you want to remove this channel?")) return;

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const updatedFeeds = userData.feeds.map((feed) => {
        if (feed.name === feedName) {
          return {
            ...feed,
            channels: feed.channels.filter((channel) => channel.channelId !== channelIdToDelete),
          };
        }
        return feed;
      });

      await updateDoc(userDocRef, { feeds: updatedFeeds });

      if (selectedChannel === channelIdToDelete) {
        setSelectedChannel(null);
      }

      loadFeedData();
    }
  } catch (error) {
    console.error("Error removing channel:", error);
  }
};

export const handleUpdateFeed = async (user, oldName, newName, newImage, updatedChannels, navigate, setFeedChannels, setChannelDetails, setVideos, setIsLoading, setHasChannels, loadChannelDetails, setCurrentFeed) => {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const updatedFeeds = userData.feeds.map((feed) => {
        if (feed.name === oldName) {
          return {
            ...feed,
            name: newName,
            image: newImage,
            channels: updatedChannels,
          };
        }
        return feed;
      });

      await updateDoc(userDocRef, { feeds: updatedFeeds });

      if (oldName !== newName) {
        navigate(`/feed/${newName}`);
      } else {
        setFeedChannels(
          updatedChannels.reduce((acc, channel) => {
            acc[channel.channelId] = channel.channelTitle;
            return acc;
          }, {})
        );
        setChannelDetails({});
        setVideos([]);
        setIsLoading(true);
        setHasChannels(updatedChannels.length > 0);

        setTimeout(() => {
          loadChannelDetails();
        }, 100);

        setCurrentFeed((prev) => ({
          ...prev,
          name: newName,
          image: newImage,
          channels: updatedChannels,
        }));
      }
    }
  } catch (error) {
    console.error("Error updating feed:", error);
  }
};


export const handleShareFeed = async (user, currentFeed) => {
  try {
    // Step 1: Create shared feed and get its ID
    const shareId = await createSharedFeed(user.uid, currentFeed);
    
    // Step 2: Generate a shareable link
    const shareableLink = `${window.location.origin}/share/${shareId}`;

    // Step 3: Copy the link to clipboard
    await navigator.clipboard.writeText(shareableLink);
    
    // Step 4: Notify the user about successful link copying
    alert("Feed link copied to clipboard!");
  } catch (error) {
    console.error("Error sharing feed:", error);
    alert("Failed to share feed. Please try again.");
  }
};

export const generateShareableLink = async (feedName) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const shortLink = `https://zenfeeds.vercel.app/share/${uniqueId}`;
  return shortLink;
};



// playlistPage Methods

export const loadUserPlaylists = async (user, setPlaylists) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      setPlaylists(userDocSnap.data().playlists || []);
    } else {
      setPlaylists([]);
    }
  }
};



export const handleAddPlaylist = async (user, playlistUrl) => {
  try {
    // Extract playlist ID from URL
    const playlistId = playlistUrl.match(/[?&]list=([^&]+)/)?.[1];
    if (!playlistId) {
      throw new Error("Invalid playlist URL");
    }

    // Fetch playlist details
    const playlistData = await fetchPlaylistDetails(playlistId);

    // Provide default values if anything is undefined
    const newPlaylist = {
      id: playlistId || "",
      title: playlistData?.snippet?.title || "Untitled",
      thumbnail: playlistData?.snippet?.thumbnails?.high?.url || "/placeholder.png",
      videoCount: playlistData?.contentDetails?.itemCount || 0,
    };

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      playlists: arrayUnion(newPlaylist),
    });

    return newPlaylist;
  } catch (error) {
    console.error("Error adding playlist:", error);
    throw error;
  }
};


export const saveLikedVideo = async (userId, videoData) => {
  try {
    const timestamp = new Date();
    const videoDataWithDate = {
      ...videoData,
      addedAt: timestamp.toISOString(),
    };

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        likedVideos: arrayUnion(videoDataWithDate),
      });
    } else {
      await setDoc(userDocRef, { likedVideos: [videoDataWithDate] });
    }
  } catch (error) {
    console.error("Error saving liked video:", error);
    throw error;
  }
};


export const removeLikedVideo = async (userId, videoIds) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().likedVideos) {
      const idsToDelete = Array.isArray(videoIds) ? videoIds : [videoIds];
      const updatedLikedVideos = userDoc
        .data()
        .likedVideos.filter((video) => !idsToDelete.includes(video.id?.videoId || video?.id));
      await updateDoc(userDocRef, { likedVideos: updatedLikedVideos });
    }
  } catch (error) {
    console.error("Error removing liked videos:", error);
    throw error;
  }
};

export const getLikedVideos = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc?.data().likedVideos || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting liked videos:", error);
    throw error;
  }
};

export const saveWatchLater = async (userId, videoData) => {
    try {
        const timestamp = new Date();
      const videoDataWithDate = {
          ...videoData,
          addedAt: timestamp.toISOString()
      }

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        watchLater: arrayUnion(videoDataWithDate),
      });
    } else {
      await setDoc(userDocRef, { watchLater: [videoDataWithDate] });
    }
  } catch (error) {
    console.error("Error saving to watch later:", error);
    throw error;
  }
};

export const getWatchLaterVideos = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().watchLater || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting watch later videos:", error);
    throw error;
  }
};

// remove watch later video
export const removeWatchLaterVideo = async (userId, videoIds) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().watchLater) {
      const idsToDelete = Array.isArray(videoIds) ? videoIds : [videoIds];
      const updatedWatchLater = userDoc
        .data()
        .watchLater.filter(
          (video) => !idsToDelete.includes(video.id?.videoId || video.id)
        );
      await updateDoc(userDocRef, { watchLater: updatedWatchLater });
    }
  } catch (error) {
    console.error("Error removing from watch later:", error);
    throw error;
  }
};



// Delete Feed 
export const handleDeleteFeed = async (user, feedNames, onSuccess, onError) => {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Handle both single feed name (string) and multiple feed names (array)
      const feedNamesToDelete = Array.isArray(feedNames) ? feedNames : [feedNames];
      const updatedFeeds = userData.feeds.filter(
        (feed) => !feedNamesToDelete.includes(feed.name)
      );
      
      await updateDoc(userDocRef, { feeds: updatedFeeds });
      if (onSuccess) onSuccess();
    }
  } catch (error) {
    console.error("Error deleting feeds:", error);
    if (onError) onError(error);
  }
};


// Delete Playlist 
export const handleDeletePlaylist = async (user, playlistIds) => {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Handle both single ID and array of IDs
      const idsToDelete = Array.isArray(playlistIds) ? playlistIds : [playlistIds];
      const updatedPlaylists = userData.playlists.filter(
        playlist => !idsToDelete.includes(playlist.id)
      );
      await updateDoc(userDocRef, { playlists: updatedPlaylists });
    }
  } catch (error) {
    console.error("Error deleting playlists:", error);
    throw error;
  }
};
export const handleShareMultipleFeeds = async (user, feedNames, allFeeds, setToastMessage, setShowToast) => {
  try {
    const feedsToShare = allFeeds.filter(feed => feedNames.includes(feed.name));
    const shareId = await createSharedFeed(user.uid, { feeds: feedsToShare });
    const shareableLink = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(shareableLink);
    setToastMessage("Feed link copied to clipboard!");
    setShowToast(true);
  } catch (error) {
    console.error("Error sharing feeds:", error);
    setToastMessage("Failed to share feeds. Please try again.");
    setShowToast(true);
  }
};

export const APP_NAME = "StoicPlay";