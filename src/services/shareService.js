// services/shareService.js
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Generate a unique short ID for the share link
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Create a shared feed document
export const createSharedFeed = async (userId, feed) => {
  if (!feed || !feed.name || !feed.image || !feed.channels) {
    throw new Error("Invalid feed data provided");
  }

  try {
    const shareId = generateUniqueId(); // Use the generateUniqueId function
    const sharedFeedDocRef = doc(db, "users", userId, "sharedFeeds", shareId);

    // Save shared feed data
    await setDoc(sharedFeedDocRef, {
      userId,
      feedName: feed.name,
      feedImage: feed.image,
      feedChannels: feed.channels,
      createdAt: new Date(),
    });

    return shareId; // Return the unique ID for the shared feed
  } catch (error) {
    console.error("Error creating shared feed:", error);
    throw new Error("Failed to create shared feed");
  }
};

// Import a shared feed for a user
export const importSharedFeed = async (userId, shareId) => {
  try {
    // Get the shared feed data
    const sharedFeedRef = doc(db, "users", userId, "sharedFeeds", shareId);
    const sharedFeedSnap = await getDoc(sharedFeedRef);

    if (!sharedFeedSnap.exists()) {
      throw new Error("Shared feed not found");
    }

    const sharedFeedData = {
      name: sharedFeedSnap.data().feedName,
      image: sharedFeedSnap.data().feedImage,
      channels: sharedFeedSnap.data().feedChannels,
    };

    // Get the user's current feeds
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, { feeds: [sharedFeedData] });
      return;
    }

    const userData = userSnap.data();
    
    // Initialize feeds array if undefined
    if (!userData.feeds) {
      userData.feeds = [];
    }

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
