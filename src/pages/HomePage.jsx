import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AddFeedModal from "../components/AddFeedModal";
import EditFeedModal from "../components/EditFeedModal";
import {
  IconCheck,
  IconCircleCheckFilled,
  IconSquareCheckFilled,
  IconSquareRoundedPlusFilled,
} from "@tabler/icons-react";
import {
  loadHomeFeeds,
  handleAddHomeFeed,
  handleUpdateHomeFeed,
} from "../utils/constant";
import { Icon } from "lucide-react";

function HomePage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [editingFeed, setEditingFeed] = useState(null);
  const [showToast, setShowToast] = useState(false); // New state for toast

  useEffect(() => {
    loadHomeFeeds(user, setFeeds);
  }, [user]);

  const handleAddFeed = async (feedName, imageUrl) => {
    await handleAddHomeFeed(user, feeds, setFeeds, feedName, imageUrl);
    setShowToast(true); // Show toast after adding feed
    setTimeout(() => setShowToast(false), 3000); // Hide toast after 3 seconds
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

  return (
    <div className="w-full min-h-dvh overflow-hidden rounded-2xl p-0 md:p-6 md:ring-[1px] md:ring-white/20">
      <div>
        <h1 className="text-white text-2xl font-medium tracking-tight">
          Hey, {user?.displayName || "there"}
        </h1>
        <p className="text-gray-500 text-sm font-semibold mb-6">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div
          onClick={() => setShowAddModal(true)}
          className="aspect-video bg-[#070707] 
          rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-[#3f3f3f] transition-colors duration-200 "
        >
          <IconSquareRoundedPlusFilled
            size={48}
            strokeWidth={1}
            className="text-gray-300 "
          />
          <span className="text-lg/4 mt-2 font-normal text-white">
            Create a new feed
          </span>
        </div>
        {feeds.map((feed) => (
          <FeedItem key={feed?.name} feed={feed} />
        ))}
      </div>

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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed flex items-start w-80 gap-2.5 top-6 right-6 z-50 bg-[#101010]/50 filter backdrop-blur ring-[1px] ring-white/20 text-white p-4 rounded-lg shadow text-sm font-medium saturate-200">
           
          <div className=" flex-shrink-0">
            <IconSquareCheckFilled
              size={20}
              strokeWidth={1}
              className="relative top-[2px] text-green-500"
            />
          </div>
          <div>
            <h1 className="text-base font-[600]">
              New feed created successfully
            </h1>
            <p className="text-sm font-[400]  text-gray-400 text-pretty">
              Your new feed is live. Start adding your favorite channels to
              personalize it further.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedItem({ feed }) {
  return (
    <div className="rounded overflow-hidden transition-all duration-500">
      <Link to={`/feed/${feed?.name}`} className="block">
        <img
          src={feed?.image || "/placeholder.png"}
          alt={feed?.name}
          className="aspect-video bg-[#272727] 
          rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-[#3f3f3f] transition-colors duration-200"
        />
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
