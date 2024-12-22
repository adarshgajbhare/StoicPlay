import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

function EditFeedModal({ isOpen, onClose, onUpdateFeed, feed }) {
  const { user } = useAuth();
  const [feedName, setFeedName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [channels, setChannels] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (feed) {
      setFeedName(feed.name);
      setImageUrl(feed.image || '');
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
        const updatedFeeds = userData.feeds.map(f => {
          if (f.name === feed.name) {
            return {
              ...f,
              name: feedName,
              image: imageUrl,
              channels: channels
            };
          }
          return f;
        });

        await updateDoc(userDocRef, { feeds: updatedFeeds });
      }
    } catch (error) {
      console.error('Error updating feed in Firebase:', error);
    }
  };

  const handleRemoveChannel = async (channelId) => {
    // Update local state
    const updatedChannels = channels.filter(channel => channel.channelId !== channelId);
    setChannels(updatedChannels);

    // Update Firebase
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const updatedFeeds = userData.feeds.map(f => {
            if (f.name === feed.name) {
              return {
                ...f,
                channels: updatedChannels
              };
            }
            return f;
          });

          await updateDoc(userDocRef, { feeds: updatedFeeds });
        }
      } catch (error) {
        console.error('Error removing channel from Firebase:', error);
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
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Feed</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedName" className="block text-sm font-medium text-gray-200">
              Feed Name
            </label>
            <input
              type="text"
              id="feedName"
              value={feedName}
              onChange={(e) => setFeedName(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Feed Image
            </label>
            <div className="flex items-center space-x-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Feed thumbnail"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Upload Image
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
            <h3 className="text-lg font-medium text-gray-200 mb-2">Channels</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {channels.map((channel) => (
                <li key={channel.channelId} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-white">{channel.channelTitle}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(channel.channelId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditFeedModal;