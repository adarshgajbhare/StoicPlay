import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AddFeedModal from '../components/AddFeedModal';
import EditFeedModal from '../components/EditFeedModal';
import FeedNavigation from '../components/FeedNavigation';

function HomePage() {
  const { user, loading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [editingFeed, setEditingFeed] = useState(null);

  const loadFeeds = () => {
    let storedFeeds = localStorage.getItem('feeds');
    if (storedFeeds) {
      setFeeds(JSON.parse(storedFeeds));
    }
  };

  useEffect(() => {
    loadFeeds();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };



  const handleAddFeed = (feedName, imageUrl) => {
    const newFeeds = [...feeds, { name: feedName, image: imageUrl }];
    setFeeds(newFeeds);
    localStorage.setItem('feeds', JSON.stringify(newFeeds));
  };

  const handleDeleteFeed = (feedName) => {
    const updatedFeeds = feeds.filter((feed) => feed.name !== feedName);
    setFeeds(updatedFeeds);
    localStorage.setItem('feeds', JSON.stringify(updatedFeeds));
    localStorage.removeItem(feedName);
  };

  const handleEditFeed = (feedName) => {
    const feedToEdit = feeds.find((feed) => feed.name === feedName);
    setEditingFeed(feedToEdit);
    setShowEditModal(true);
  };

  const handleUpdateFeed = (oldName, newName, newImageUrl) => {
    const updatedFeeds = feeds.map((feed) =>
      feed.name === oldName ? { name: newName, image: newImageUrl } : feed
    );
    setFeeds(updatedFeeds);
    localStorage.setItem('feeds', JSON.stringify(updatedFeeds));
    if (oldName !== newName) {
      const feedData = localStorage.getItem(oldName);
      localStorage.setItem(newName, feedData);
      localStorage.removeItem(oldName);
    }
  };

  return (
    <div className="min-h-screen  bg-black  text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text text-white">
            Youtube Feeds
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm">{user.displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
        <FeedNavigation feeds={feeds} />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
          {feeds.map((feed) => (
            <div key={feed.name} className="bg-white ring ring-white/10 bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden transition-transform duration-200 ease-in-out transform hover:scale-105">
              <Link to={`/feed/${feed.name}`}>
                <img
                  src={feed.image || '/placeholder.png'}
                  alt={feed.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-lg font-semibold">{feed.name}</h2>
                </div>
              </Link>
              <div className="p-4 pt-0 flex justify-between">
                <button
                  onClick={() => handleEditFeed(feed.name)}
                  className="text-blue-300 hover:text-blue-100 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteFeed(feed.name)}
                  className="text-red-300 hover:text-red-100 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          className="fixed bottom-8 right-8 bg-pink-500 text-white p-4 rounded-full shadow-lg transition-transform duration-200 ease-in-out transform hover:scale-110 active:scale-90"
          onClick={() => setShowAddModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        {showAddModal && (
          <AddFeedModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAddFeed={handleAddFeed}
          />
        )}
        {showEditModal && (
          <EditFeedModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onUpdateFeed={handleUpdateFeed}
            feed={editingFeed}
          />
        )}
      </div>
    </div>
  );
}

export default HomePage;

