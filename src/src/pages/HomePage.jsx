import React, { useState, useEffect } from 'react';
import FeedList from '../components/FeedList';
import AddFeedModal from '../components/AddFeedModal';

function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [feeds, setFeeds] = useState([]);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = () => {
    let storedFeeds = localStorage.getItem('feeds');
    if (storedFeeds) {
      setFeeds(JSON.parse(storedFeeds));
    }
  };

  const handleAddFeed = (feedName, imageUrl) => {
    const newFeeds = [...feeds, feedName];
    setFeeds(newFeeds);
    localStorage.setItem('feeds', JSON.stringify(newFeeds));
    localStorage.setItem(`${feedName}-image`, imageUrl);
  };

  const handleDeleteFeed = (feedName) => {
    const updatedFeeds = feeds.filter((feed) => feed !== feedName);
    setFeeds(updatedFeeds);
    localStorage.setItem('feeds', JSON.stringify(updatedFeeds));
    localStorage.removeItem(feedName);
    localStorage.removeItem(`${feedName}-image`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-center text-5xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          Youtube Feeds
        </h1>
        <FeedList
          feeds={feeds}
          onDeleteFeed={handleDeleteFeed}
        />
        <button
          className="fixed bottom-8 right-8 bg-pink-500 text-white p-4 rounded-full shadow-lg transition-transform duration-200 ease-in-out transform hover:scale-110 active:scale-90"
          onClick={() => setShowModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        {showModal && (
          <AddFeedModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onAddFeed={handleAddFeed}
          />
        )}
      </div>
    </div>
  );
}

export default HomePage;

