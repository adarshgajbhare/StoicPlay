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

export const handleDeleteFeed = async (user, feedName, navigate) => {
  if (!window.confirm("Are you sure you want to delete this feed?")) return;

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const updatedFeeds = userData.feeds.filter((feed) => feed.name !== feedName);
      await updateDoc(userDocRef, { feeds: updatedFeeds });
      navigate("/");
    }
  } catch (error) {
    console.error("Error deleting feed:", error);
  }
};

export const handleShareFeed = async (user, currentFeed) => {
  try {
    const shareId = await createSharedFeed(user.uid, currentFeed);
    const shareableLink = `${window.location.origin}/share/${shareId}`;

    await navigator.clipboard.writeText(shareableLink);
    alert("Feed link copied to clipboard!");
  } catch (error) {
    console.error("Error sharing feed:", error);
    alert("Failed to share feed. Please try again.");
  }
};

export const generateShareableLink = async (feedName) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const shortLink = `https://your-app-url/share/${uniqueId}`;
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
      throw new Error('Invalid playlist URL');
    }

    // Fetch playlist details
    const playlistData = await fetchPlaylistDetails(playlistId);
    
    const newPlaylist = {
      id: playlistId,
      title: playlistData.snippet.title,
      thumbnail: playlistData.snippet.thumbnails.high.url,
      videoCount: playlistData.contentDetails.itemCount,
    };

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      playlists: arrayUnion(newPlaylist)
    });

    return newPlaylist;
  } catch (error) {
    console.error("Error adding playlist:", error);
    throw error;
  }
};


