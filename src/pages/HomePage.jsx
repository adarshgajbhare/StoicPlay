/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AddFeedModal from "../components/AddFeedModal";
import EditFeedModal from "../components/EditFeedModal";
import ImportFeedModal from "../components/ImportFeedModal";
import {
  IconCheck,
  IconSquareCheckFilled,
  IconSquareRoundedPlusFilled,
  IconMinus,
  IconEdit,
  IconShare2,
  IconTrash,
  IconShare3,
  IconArrowBack,
} from "@tabler/icons-react";
import {
  loadHomeFeeds,
  handleAddHomeFeed,
  handleUpdateHomeFeed,
  handleDeleteFeed,
  handleShareMultipleFeeds,
} from "../utils/constant";
import Toast from "../components/Toast";
import { motion, AnimatePresence } from "framer-motion";

function HomePage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [editingFeed, setEditingFeed] = useState(null);
  const [isShareMode, setIsShareMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [feedsToShare, setFeedsToShare] = useState(new Set());
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

  const handleUpdateFeed = async (
    oldName,
    newName,
    newImageUrl,
    updatedChannels
  ) => {
    await handleUpdateHomeFeed(
      user,
      feeds,
      setFeeds,
      oldName,
      newName,
      newImageUrl,
      updatedChannels
    );
    setToastMessage("Feed updated successfully");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleShareMode = () => {
    if (isShareMode) {
      if (feedsToShare.size > 0) {
        handleShareMultipleFeeds(
          user,
          Array.from(feedsToShare),
          feeds,
          setToastMessage,
          setShowToast
        );
      }
      setIsShareMode(false);
      setFeedsToShare(new Set());
    } else {
      setIsShareMode(true);
      setIsDeleteMode(false);
      setFeedsToDelete(new Set());
    }
  };

  const handleDeleteMode = () => {
    if (isDeleteMode) {
      if (feedsToDelete.size > 0) {
        setShowDeleteConfirmation(true);
      } else {
        setIsDeleteMode(false);
      }
    } else {
      setIsDeleteMode(true);
      setIsShareMode(false);
      setFeedsToShare(new Set());
    }
  };

  const handleUnselectAll = () => {
    setIsShareMode(false);
    setIsDeleteMode(false);
    setFeedsToShare(new Set());
    setFeedsToDelete(new Set());
  };

  const toggleFeedToShare = (feedName) => {
    const newFeedsToShare = new Set(feedsToShare);
    if (newFeedsToShare.has(feedName)) {
      newFeedsToShare.delete(feedName);
    } else {
      newFeedsToShare.add(feedName);
    }
    setFeedsToShare(newFeedsToShare);
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

  const handleImportFeed = async (importedFeed) => {
    setFeeds([...feeds, importedFeed]);
    setToastMessage("Feed imported successfully");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const confirmDelete = async () => {
    const feedsArray = Array.from(feedsToDelete);
    try {
      await handleDeleteFeed(
        user,
        feedsArray,
        () => {
          setFeeds((currentFeeds) =>
            currentFeeds.filter((feed) => !feedsToDelete.has(feed.name))
          );
          setToastMessage(
            `Successfully deleted ${feedsArray.length} feed${
              feedsArray.length > 1 ? "s" : ""
            }`
          );
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
    } catch (error) {
      console.error("Error in deletion process:", error);
    }
  };

  const handleOpenEditModal = (feed) => {
    setEditingFeed(feed);
    setShowEditModal(true);
  };

  return (
    <div className="w-full min-h-dvh overflow-hidden rounded-2xl p-4 md:p-5 md:shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]">
      <div className="flex justify-between items-start mb-4 ">
        <div>
          <h1 className="text-gray-50 text-xl uppercase font-bold ">
            Hey, {user?.displayName?.split(" ")?.[0] || "there"}
          </h1>
          <p className="text-[#555555] text-xs uppercase font-bold">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="fixed md:top-7 bottom-6 right-6 md:right-10 z-50">
          <div className="flex items-center gap-2  bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2">
            <AnimatePresence>
              {(isShareMode && feedsToShare.size > 0) ||
              (isDeleteMode && feedsToDelete.size > 0) ? (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onClick={handleUnselectAll}
                  className="bg-gray-100 text-gray-500 p-2 rounded-full relative"
                >
                  <IconArrowBack size={20} />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs text-white bg-gray-500 rounded-full border-2 border-white"
                  >
                    {isShareMode ? feedsToShare.size : feedsToDelete.size}
                  </motion.span>
                </motion.button>
              ) : null}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleShareMode}
                disabled={isDeleteMode}
                className={`p-2 rounded-full ${
                  isShareMode
                    ? "bg-blue-100 text-blue-500"
                    : isDeleteMode
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-100"
                } transition-colors`}
              >
                <IconShare3 size={20} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteMode}
                disabled={isShareMode}
                className={`p-2 rounded-full ${
                  isDeleteMode
                    ? "bg-red-100 text-red-500"
                    : isShareMode
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-100"
                } transition-colors`}
              >
                <IconTrash size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6 px-1 md:px-0">
        <div>
          <div
            onClick={() =>
              !isShareMode && !isDeleteMode && setShowAddModal(true)
            }
            className={`aspect-video bg-[#151515]
            rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-[#3f3f3f]/30 transition-colors duration-200 shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]
            ${
              isShareMode || isDeleteMode ? "opacity-50 cursor-not-allowed" : ""
            }`}
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
            isShareMode={isShareMode}
            isDeleteMode={isDeleteMode}
            isSelectedForShare={feedsToShare.has(feed.name)}
            isSelectedForDelete={feedsToDelete.has(feed.name)}
            onToggleShare={() => toggleFeedToShare(feed.name)}
            onToggleDelete={() => toggleFeedToDelete(feed.name)}
            onEdit={() => handleOpenEditModal(feed)}
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
          onClose={() => {
            setShowEditModal(false);
            setEditingFeed(null);
          }}
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

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#151515] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              Delete Feeds?
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete {feedsToDelete.size} selected feed
              {feedsToDelete.size > 1 ? "s" : ""}? This action cannot be undone.
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

function FeedItem({
  feed,
  isShareMode,
  isDeleteMode,
  isSelectedForShare,
  isSelectedForDelete,
  onToggleShare,
  onToggleDelete,
  onEdit,
}) {
  return (
    <motion.div
      layout
      className={`rounded transition-all duration-500 relative group ${
        isShareMode || isDeleteMode ? "animate-wiggle" : ""
      }`}
    >
      <AnimatePresence>
        {(isShareMode || isDeleteMode) && (
          <motion.button
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.preventDefault();
              isShareMode ? onToggleShare() : onToggleDelete();
            }}
            className={`absolute -left-1 -top-1 z-20 size-5  ${
              isShareMode
                ? isSelectedForShare
                  ? "bg-blue-600"
                  : "bg-gray-600"
                : isSelectedForDelete
                ? "bg-red-600"
                : "bg-gray-600"
            } rounded-full flex border   items-center justify-center shadow-lg isolate hover:bg-blue-500 transition-colors`}
            aria-label={`Toggle ${isShareMode ? "share" : "delete"} ${
              feed?.name
            }`}
          >
            {isShareMode ? (
              isSelectedForShare ? (
                <IconCheck size={14} className="text-white" strokeWidth={2} />
              ) : (
                <IconShare2 size={14} className="text-white" strokeWidth={2} />
              )
            ) : isSelectedForDelete ? (
              <IconCheck size={12} className="text-white" strokeWidth={2} />
            ) : (
              <IconMinus size={12} className="text-white" strokeWidth={2} />
            )}
          </motion.button>
        )}
      </AnimatePresence>
      <Link
        to={isShareMode || isDeleteMode ? "#" : `/feed/${feed?.name}`}
        className={`block ${
          isShareMode || isDeleteMode ? "cursor-default" : ""
        }`}
      >
        <div className="relative">
          <img
            src={feed?.image || "/placeholder.png"}
            alt={feed?.name}
            className={`aspect-video bg-[#272727] rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-[#3f3f3f] transition-colors duration-200 ${
              isSelectedForShare || isSelectedForDelete ? "opacity-50" : ""
            }`}
          />
        </div>
        <div className="my-3">
          <h2 className="text-lg/4 font-medium tracking-tight text-white text-center">
            {feed?.name}
          </h2>
        </div>
      </Link>
      {!isShareMode && !isDeleteMode && (
        <div className="absolute right-2 top-2 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="group relative p-2  rounded-full flex items-center justify-center shadow-lg hover:shadow-xl "
            aria-label={`Edit ${feed?.name}`}
          >
            <IconEdit size={16} className="text-white" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default HomePage;
