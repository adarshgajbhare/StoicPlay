/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AddFeedModal from "../components/AddFeedModal";
import EditFeedModal from "../components/EditFeedModal";
import { Plus } from "lucide-react";
import Navbar from "../components/Navbar";
import ImportFeedModal from "../components/ImportFeedModal";
import { loadHomeFeeds, handleAddHomeFeed, handleUpdateHomeFeed } from "../utils/constant";

function HomePage() {
  const { user, loading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [editingFeed, setEditingFeed] = useState(null);

  useEffect(() => {
    loadHomeFeeds(user, setFeeds);
  }, [user]);

  const handleAddFeed = async (feedName, imageUrl) => {
    await handleAddHomeFeed(user, feeds, setFeeds, feedName, imageUrl);
  };

  const handleUpdateFeed = async (oldName, newName, newImageUrl) => {
    await handleUpdateHomeFeed(user, feeds, setFeeds, oldName, newName, newImageUrl);
  };

  const handleImportFeed = async (feedUrl) => {
    console.log("Importing feed from URL:", feedUrl);
    alert(`Importing feed from ${feedUrl}. This feature is not fully implemented yet.`);
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
    <div className="min-h-dvh bg-[#101010] text-white">
      <Navbar onImportClick={() => setShowImportModal(true)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div
            onClick={() => setShowAddModal(true)}
            className="bg-[#101010] shadow-[inset_0px_2px_2px_0px_rgba(255,255,255,0.2)] drop-shadow-[0px_2px_0px_hsla(0,0%,100%,0.15)] h-52 ring-[1px] ring-white/15 rounded-md overflow-hidden cursor-pointer flex text-2xl/6 font-medium tracking-tight text-[#555555] flex-col items-center justify-center gap-2"
          >
            <Plus size={48} strokeWidth={2} />
            <span className="text-2xl/6 font-medium tracking-tight">
              Create feed
            </span>
          </div>
          {feeds.map((feed) => (
            <FeedItem key={feed?.name} feed={feed} />
          ))}
        </div>
      </main>

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
      {showImportModal && (
        <ImportFeedModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportFeed={handleImportFeed}
        />
      )}
    </div>
  );
}

function FeedItem({ feed }) {
  return (
    <div className="bg-[#151515] ring-[1px] ring-white/15 rounded-md shadow-lg overflow-hidden transition-all duration-500 hover:shadow-xl hover:scale-105">
      <Link to={`/feed/${feed?.name}`} className="block">
        <img
          src={feed?.image || "/placeholder.png"}
          alt={feed?.name}
          className="w-full h-40 object-cover rounded-md"
        />
        <div className="p-4">
          <h2 className="text-lg/4 font-medium tracking-tight text-white">
            {feed?.name}
          </h2>
        </div>
      </Link>
    </div>
  );
}

export default HomePage;