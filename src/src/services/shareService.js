// services/shareService.js
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Generate a unique short ID for the share link
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Create a shared feed document
export const createSharedFeed = async (userId, feedData) => {
  try {
    const shareId = generateUniqueId();
    const sharedFeedRef = doc(db, "sharedFeeds", shareId);
    
    // Store the feed data with metadata
    await setDoc(sharedFeedRef, {
      feedData,
      sharedBy: userId,
      createdAt: new Date().toISOString(),
      shareId
    });

    return shareId;
  } catch (error) {
    console.error("Error creating shared feed:", error);
    throw error;
  }
};

// Import a shared feed for a user
export const importSharedFeed = async (userId, shareId) => {
  try {
    // Get the shared feed data
    const sharedFeedRef = doc(db, "sharedFeeds", shareId);
    const sharedFeedSnap = await getDoc(sharedFeedRef);

    if (!sharedFeedSnap.exists()) {
      throw new Error("Shared feed not found");
    }

    const sharedFeedData = sharedFeedSnap.data().feedData;

    // Get the user's current feeds
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, { feeds: [sharedFeedData] });
      return;
    }

    const userData = userSnap.data();
    
    // Check if feed name already exists
    let newFeedName = sharedFeedData.name;
    let counter = 1;
    while (userData.feeds.some(feed => feed.name === newFeedName)) {
      newFeedName = `${sharedFeedData.name} (${counter})`;
      counter++;
    }

    const newFeed = {
      ...sharedFeedData,
      name: newFeedName
    };

    // Add the new feed to user's feeds
    await updateDoc(userRef, {
      feeds: [...userData.feeds, newFeed]
    });

    return newFeed;
  } catch (error) {
    console.error("Error importing shared feed:", error);
    throw error;
  }
};