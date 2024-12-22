import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AddFeedModal from '../components/AddFeedModal';
import EditFeedModal from '../components/EditFeedModal';
import FeedNavigation from '../components/FeedNavigation';
import { collection, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { Plus, LogOut, Edit2, Trash2 } from 'lucide-react';

function HomePage() {
  const { user, loading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [editingFeed, setEditingFeed] = useState(null);

  const loadFeeds = async () => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setFeeds(userDocSnap.data().feeds || []);
      } else {
        console.log("No such document! Creating a new one...");
        setFeeds([]);
      }
    }
  };

  useEffect(() => {
    loadFeeds();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddFeed = async (feedName, imageUrl) => {
    const newFeed = { name: feedName, image: imageUrl, channels: [] };
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      await updateDoc(userDocRef, {
        feeds: arrayUnion(newFeed)
      });
    } else {
      await setDoc(userDocRef, {
        feeds: [newFeed]
      });
    }

    setFeeds([...feeds, newFeed]);
  };


  const handleUpdateFeed = async (oldName, newName, newImageUrl) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const updatedFeeds = feeds.map(feed =>
        feed.name === oldName ? { ...feed, name: newName, image: newImageUrl } : feed
      );
      const oldFeed = feeds.find(feed => feed.name === oldName);
      const newFeed = updatedFeeds.find(feed => feed.name === newName);
          
      await updateDoc(userDocRef, {
        feeds: arrayRemove(oldFeed)
      });
      await updateDoc(userDocRef, {
        feeds: arrayUnion(newFeed)
      });

      setFeeds(updatedFeeds);
    } else {
      console.log("No such document!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-400">Youtube Feeds</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border-2 border-blue-400"
                />
                <span className="text-sm font-medium">{user.displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center space-x-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeedNavigation feeds={feeds} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {feeds.map((feed) => (
            <div key={feed.name} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105">
              <Link to={`/feed/${feed.name}`} className="block">
                <img
                  src={feed.image || '/placeholder.png'}
                  alt={feed.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-blue-400">{feed.name}</h2>
                </div>
              </Link>
          
            </div>
          ))}
        </div>
      </main>

      <button
        className="fixed bottom-8 right-8 bg-blue-500 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:bg-blue-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        onClick={() => setShowAddModal(true)}
      >
        <Plus size={24} />
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
  );
}

export default HomePage;

