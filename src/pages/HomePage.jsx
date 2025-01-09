import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AddFeedModal from "../components/AddFeedModal";
import EditFeedModal from "../components/EditFeedModal";
import {
  IconCheck,
  IconCircleCheckFilled,
  IconSquareCheckFilled,
  IconSquareRoundedPlusFilled,
  IconMinus,
  IconX,
} from "@tabler/icons-react";
import {
  loadHomeFeeds,
  handleAddHomeFeed,
  handleUpdateHomeFeed,
  handleDeleteFeed,
} from "../utils/constant";
import Toast from "../components/Toast";

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [editingFeed, setEditingFeed] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [feedsToDelete, setFeedsToDelete] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    loadHomeFeeds(user, setFeeds);
  }, [user]);

  const handleAddFeed = async (feedName, imageUrl) => {
    await handleAddHomeFeed(user, feeds, setFeeds, feedName, imageUrl);
    setToastMessage("New feed created successfully");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUpdateFeed = async (oldName, newName, newImageUrl) => {
    await handleUpdateHomeFeed(
      user,
      feeds,
      setFeeds,
      oldName,
      newName,
      newImageUrl
    );
  };

  const toggleFeedToDelete = (feedName) => {
    const newFeedsToDelete = new Set(feedsToDelete);
    if (newFeedsToDelete.has(feedName)) {
      newFeedsToDelete.delete(feedName);
    } else {
      newFeedsToDelete.add(feedName);
    }
    setFeedsToDelete(newFeedsToDelete);
  };

  const handleDeleteMode = () => {
    if (isDeleteMode && feedsToDelete.size > 0) {
      setShowDeleteConfirmation(true);
    } else {
      setIsDeleteMode(!isDeleteMode);
      setFeedsToDelete(new Set());
    }
  };

  const confirmDelete = async () => {
    const feedsArray = Array.from(feedsToDelete);
    try {
      await handleDeleteFeed(
        user,
        feedsArray,
        () => {
          setFeeds(currentFeeds => 
            currentFeeds.filter(feed => !feedsToDelete.has(feed.name))
          );
          setToastMessage(`Successfully deleted ${feedsArray.length} feed${feedsArray.length > 1 ? 's' : ''}`);
          setShowToast(true);
        },
        (error) => {
          console.error("Error deleting feeds:", error);
          setToastMessage("Error deleting feeds. Please try again.");
          setShowToast(true);
        }
      );
      
      setTimeout(() => setShowToast(false), 3000);
      setFeedsToDelete(new Set());
      setIsDeleteMode(false);
      setShowDeleteConfirmation(false);
      await loadHomeFeeds(user, setFeeds);
    } catch (error) {
      console.error("Error in deletion process:", error);
    }
  };
  

  return (
    <div className="w-full min-h-dvh overflow-hidden rounded-2xl p-0 md:p-8 md:shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-white text-2xl md:text-4xl font-medium tracking-tight">
            Hey, {user?.displayName?.split(" ")?.[0] || "there"}
          </h1>
          <p className="text-gray-600 text-xs md:text-base font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isDeleteMode && feedsToDelete.size > 0 && (
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete ({feedsToDelete.size})
            </button>
          )}
          <button
            onClick={handleDeleteMode}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isDeleteMode ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div>
          <div
            onClick={() => !isDeleteMode && setShowAddModal(true)}
            className={`aspect-video bg-[#151515]
            rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-[#3f3f3f]/30 transition-colors duration-200 shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]
            ${isDeleteMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <IconSquareRoundedPlusFilled
              size={40}
              strokeWidth={1}
              className="text-gray-500"
            />
          </div>
          <p className="text-lg/4 mt-3 font-medium text-gray-500 text-center">
            Add new feed
          </p>
        </div>
        {feeds.map((feed) => (
          <FeedItem
            key={feed?.name}
            feed={feed}
            isDeleteMode={isDeleteMode}
            isSelected={feedsToDelete.has(feed.name)}
            onToggleDelete={() => toggleFeedToDelete(feed.name)}
          />
        ))}
      </div>

      {showAddModal && (
        <AddFeedModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddFeed={handleAddFeed}
          existingFeeds={feeds}
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

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#151515] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              Delete Feeds?
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete {feedsToDelete.size} selected feed{feedsToDelete.size > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <Toast
          isOpen={showToast}
          message={toastMessage}
          secondaryText={
            toastMessage.includes("created")
              ? "Try adding your favorite channels..."
              : "This action cannot be undone."
          }
          variant="info"
          icon={IconSquareCheckFilled}
          duration={5000}
          onClose={() => setShowToast(false)}
          position="top-right"
          showCloseButton
        />
      )}
    </div>
  );
}

function FeedItem({ feed, isDeleteMode, isSelected, onToggleDelete }) {
  return (
    <div className="rounded transition-all duration-500 relative group">
      {isDeleteMode && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleDelete();
          }}
          className={`absolute -left-1 -top-1 z-20 size-5 ${
            isSelected ? 'bg-red-600' : 'bg-gray-600'
          } rounded-full flex items-center justify-center shadow-lg isolate hover:bg-red-500 transition-colors`}
          aria-label={`Toggle delete ${feed.name}`}
        >
          {isSelected ? (
            <IconCheck size={12} className="text-white" strokeWidth={2} />
          ) : (
            <IconMinus size={12} className="text-white" strokeWidth={2} />
          )}
        </button>
      )}
      <Link
        to={isDeleteMode ? "#" : `/feed/${feed?.name}`}
        className={`block ${isDeleteMode ? "cursor-default" : ""}`}
      >
        <div className={`relative ${isDeleteMode ? "animate-wiggle" : ""}`}>
          <img
            src={feed?.image || "/placeholder.png"}
            alt={feed?.name}
            className={`aspect-video bg-[#272727] rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-[#3f3f3f] transition-colors duration-200 ${
              isSelected ? 'opacity-50' : ''
            }`}
          />
        </div>
        <div className="my-3">
          <h2 className="text-lg/4 font-medium tracking-tight text-white text-center">
            {feed?.name}
          </h2>
        </div>
      </Link>
    </div>
  );
}

export default HomePage;