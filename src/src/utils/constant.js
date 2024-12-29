import { doc, getDoc, updateDoc } from "firebase/firestore";
import { createSharedFeed } from "../services/shareService";
import { fetchChannelDetails, fetchChannelVideos } from "../services/youtubeApi";
import { db } from "../lib/firebase";



// HomePage Methods


// ...existing code...

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

export const handleAddHomeFeed = async (user, feeds, setFeeds, feedName, imageUrl) => {
  const newFeed = { name: feedName, image: imageUrl, channels: [] };
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    await updateDoc(userDocRef, {
      feeds: arrayUnion(newFeed),
    });
  } else {
    await setDoc(userDocRef, {
      feeds: [newFeed],
    });
  }

  setFeeds([...feeds, newFeed]);
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

