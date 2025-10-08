import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loadHomeFeeds,
  handleAddHomeFeed,
  handleUpdateHomeFeed,
  handleDeleteFeed,
  handleShareMultipleFeeds,
} from "../utils/constant";

export const fetchFeeds = createAsyncThunk("feeds/fetchFeeds", async (user) => {
  const feeds = [];
  await loadHomeFeeds(user, (data) => feeds.push(...data));
  return feeds;
});

export const addFeed = createAsyncThunk(
  "feeds/addFeed",
  async ({ user, feedName, imageFile }, { dispatch }) => {
    // Create the new feed object first
    let imageUrl = "/default-thumb.webp";
    
    if (imageFile) {
      try {
        const { compressImage } = await import("../utils/imageUtils");
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

    // Add to Redux state immediately
    dispatch(add(newFeed));
    
    // Then save to Firebase (don't wait for callback)
    await handleAddHomeFeed(user, null, () => {}, feedName, imageFile);
    
    return newFeed;
  }
);

export const updateFeed = createAsyncThunk(
  "feeds/updateFeed",
  async ({ user, oldName, newName, imageUrl }, { dispatch }) => {
    await handleUpdateHomeFeed(user, null, null, oldName, newName, imageUrl);
    dispatch(edit({ oldName, newName, imageUrl }));
  }
);

export const deleteFeeds = createAsyncThunk(
  "feeds/deleteFeeds",
  async ({ user, feedNames }, { dispatch }) => {
    await handleDeleteFeed(user, feedNames);
    dispatch(remove(feedNames));
  }
);

export const shareFeeds = createAsyncThunk(
  "feeds/shareFeeds",
  async ({ user, feedNames, feeds }, { dispatch }) => {
    await handleShareMultipleFeeds(user, feedNames, feeds);
  }
);

const feedsSlice = createSlice({
  name: "feeds",
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    add: (state, action) => {
      // Check if feed already exists to prevent duplicates
      const existingFeed = state.items.find(feed => feed.name === action.payload.name);
      if (!existingFeed) {
        state.items.push(action.payload);
      }
    },
    edit: (state, action) => {
      const { oldName, newName, imageUrl } = action.payload;
      const feed = state.items.find((feed) => feed.name === oldName);
      if (feed) {
        feed.name = newName;
        feed.image = imageUrl;
      }
    },
    remove: (state, action) => {
      const feedNames = action.payload;
      state.items = state.items.filter((feed) => !feedNames.includes(feed.name));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeeds.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFeeds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchFeeds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(addFeed.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addFeed.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { add, edit, remove } = feedsSlice.actions;
export default feedsSlice.reducer;