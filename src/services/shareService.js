import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const createSharedFeed = async (userId, feed) => {
  if (!feed || !feed.name || !feed.channels) {
    throw new Error("Invalid feed data provided");
  }

  try {
    const shareId = generateUniqueId();
    const sharedFeedDocRef = doc(db, "sharedFeeds", shareId);

    await setDoc(sharedFeedDocRef, {
      creatorId: userId,
      feedName: feed.name,
      feedImage: feed.image || "",
      feedChannels: feed.channels,
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
    
    const newFeed = {
      name: sharedFeedData.feedName,
      image: sharedFeedData.feedImage || "",
      channels: sharedFeedData.feedChannels
    };

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, { feeds: [newFeed] });
      return;
    }

    const userData = userSnap.data();
    const feeds = userData.feeds || [];
    
    let uniqueName = newFeed.name;
    let counter = 1;
    while (feeds.some(feed => feed.name === uniqueName)) {
      uniqueName = `${newFeed.name} (${counter})`;
      counter++;
    }
    newFeed.name = uniqueName;

    await updateDoc(userRef, {
      feeds: [...feeds, newFeed]
    });

    return newFeed;
  } catch (error) {
    console.error("Error importing shared feed:", error);
    throw error;
  }
};