import React, { useState, useEffect, useRef } from "react";
import { Trash, Trash2 } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

function EditFeedModal({ isOpen, onClose, onUpdateFeed, feed }) {
  const { user } = useAuth();
  const [feedName, setFeedName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [channels, setChannels] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (feed) {
      setFeedName(feed.name);
      setImageUrl(feed.image || "");
      setChannels(feed.channels || []);
    }
  }, [feed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateFeedInFirebase();
    onUpdateFeed(feed.name, feedName, imageUrl, channels);
    onClose();
  };

  const updateFeedInFirebase = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedFeeds = userData.feeds.map((f) => {
          if (f.name === feed.name) {
            return {
              ...f,
              name: feedName,
              image: imageUrl,
              channels: channels,
            };
          }
          return f;
        });

        await updateDoc(userDocRef, { feeds: updatedFeeds });
      }
    } catch (error) {
      console.error("Error updating feed in Firebase:", error);
    }
  };

  const handleRemoveChannel = async (channelId) => {
    // Update local state
    const updatedChannels = channels.filter(
      (channel) => channel.channelId !== channelId
    );
    setChannels(updatedChannels);

    // Update Firebase
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const updatedFeeds = userData.feeds.map((f) => {
            if (f.name === feed.name) {
              return {
                ...f,
                channels: updatedChannels,
              };
            }
            return f;
          });

          await updateDoc(userDocRef, { feeds: updatedFeeds });
        }
      } catch (error) {
        console.error("Error removing channel from Firebase:", error);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#101010] ring-[1px] ring-white/10 rounded-md p-6 w-full max-w-md">
        <h2 className="text-2xl font-medium tracking-tight text-white mb-4">
          Make changes to your feed
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="feedName"
              className="block mb-3 tracking-tight text-lg/4 text-white"
            >
              Your feed name
            </label>
            <input
              type="text"
              id="feedName"
              value={feedName}
              placeholder="Change your feed name..."
              onChange={(e) => setFeedName(e.target.value)}
              className="w-full p-3 text-white placeholder:text-white/35 ring-[1px] ring-white/20 bg-white/5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
           <label htmlFor="imageUrl" className="block mb-3 tracking-tight text-lg/4 text-white">
              Change your feed image
            </label>
            <div className="flex items-center space-x-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Feed thumbnail"
                  className="size-10 rounded-lg ring-[1px] ring-white/20 object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid  place-items-center text-pretty rounded-md text-lg/4 p-3 bg-[#303030] font-medium tracking-tight text-white/90 shadow-[inset_0px_2px_2px_0px_hsla(0,0%,0%,0.4)] drop-shadow-[0px_2px_0px_hsla(0,0%,100%,0.15)]"
              >
                Change image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>











          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-2">Channels added to feed</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {channels.map((channel) => (
                <li
                  key={channel.channelId}
                  className="flex justify-between items-center bg-[#202020] p-3  rounded-md"
                >
                  <span className="text-white text-lg/4">{channel.channelTitle}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(channel.channelId)}
                    className="text-red-600 hover:text-red-400"
                  >
                    <Trash className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="g-black ring-[1px] ring-white/20 flex-1 hover:bg-red-500 text-white font-medium tracking-tight text-lg/4 py-3 px-4 rounded-md "
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-white  hover:bg-blue-500 hover:text-white   flex-1 text-black font-medium tracking-tight text-lg/4 py-3 px-4 rounded-md"
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditFeedModal;
