import React, { useState, useEffect } from 'react';

function EditFeedModal({ isOpen, onClose, onUpdateFeed, feed }) {
  const [feedName, setFeedName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    if (feed) {
      setFeedName(feed.name);
      setImageUrl(feed.image);
      const feedChannels = JSON.parse(localStorage.getItem(feed.name) || '{}');
      setChannels(Object.entries(feedChannels).map(([id, title]) => ({ id, title })));
    }
  }, [feed]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateFeed(feed.name, feedName, imageUrl);
    onClose();
  };

  const handleRemoveChannel = (channelId) => {
    const updatedChannels = channels.filter(channel => channel.id !== channelId);
    setChannels(updatedChannels);
    const updatedFeedChannels = Object.fromEntries(updatedChannels.map(c => [c.id, c.title]));
    localStorage.setItem(feed.name, JSON.stringify(updatedFeedChannels));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-200">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-2">Channels</h3>
            <ul className="space-y-2">
              {channels.map((channel) => (
                <li key={channel.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span className="text-white">{channel.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(channel.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
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

