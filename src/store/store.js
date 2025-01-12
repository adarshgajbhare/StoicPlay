import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import feedsReducer from "./feedsSlice";
const store = configureStore({
  reducer: {
    auth: authReducer,
    feeds: feedsReducer,
  },

});

export default store;
