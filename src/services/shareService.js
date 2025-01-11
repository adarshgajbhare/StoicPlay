import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const createSharedFeed = async (userId, feedData) => {
  if (!feedData || !feedData.feeds || feedData.feeds.length === 0) {
    throw new Error("Invalid feed data provided");
  }

  try {
    const shareId = generateUniqueId();
    const sharedFeedDocRef = doc(db, "sharedFeeds", shareId);

    await setDoc(sharedFeedDocRef, {
      creatorId: userId,
      feeds: feedData.feeds.map(feed => ({
        feedName: feed.name,
        feedImage: feed.image || "",
        feedChannels: feed.channels
      })),
      createdAt: new Date().toISOString()
    });

    return shareId;
  } catch (error) {
    console.error("Error creating shared feed:", error);
    throw error;
  }
};

export const importSharedFeed = async (userId, shareId) => {
  try {
    const sharedFeedRef = doc(db, "sharedFeeds", shareId);
    const sharedFeedSnap = await getDoc(sharedFeedRef);

    if (!sharedFeedSnap.exists()) {
      throw new Error("Shared feed not found");
    }

    const sharedFeedData = sharedFeedSnap.data();
    
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, { feeds: sharedFeedData.feeds });
      return;
    }

    const userData = userSnap.data();
    const existingFeeds = userData.feeds || [];
    
    const newFeeds = sharedFeedData.feeds.map(feed => {
      let uniqueName = feed.feedName;
      let counter = 1;
      while (existingFeeds.some(existingFeed => existingFeed.name === uniqueName)) {
        uniqueName = `${feed.feedName} (${counter})`;
        counter++;
      }
      return {
        name: uniqueName,
        image: feed.feedImage,
        channels: feed.feedChannels
      };
    });

    await updateDoc(userRef, {
      feeds: [...existingFeeds, ...newFeeds]
    });

    return newFeeds;
  } catch (error) {
    console.error("Error importing shared feed:", error);
    throw error;
  }
};