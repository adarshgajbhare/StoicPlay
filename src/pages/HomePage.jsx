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
    <div className="w-full min-h-dvh overflow-hidden rounded-2xl p-0 md:p-8  md:shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)] ">
      <div>
        <h1 className="text-white  text-2xl md:text-4xl font-medium tracking-tight">
          Hey, {user?.displayName?.split(" ")?.[0] || "there"}
        </h1>
        <p className="text-gray-600 text-xs md:text-base font-medium mb-6">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div>
          <div
            onClick={() => setShowAddModal(true)}
            className="aspect-video bg-[#151515]
            rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-[#3f3f3f]/30 transition-colors duration-200 shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)]"
          >
            <IconSquareRoundedPlusFilled
              size={40}
              strokeWidth={1}
              className="text-gray-500 "
            />
          </div>
          <p className="text-lg/4 mt-3 font-medium text-gray-500 text-center">
            Add new feed
          </p>
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
        <div className="fixed flex items-start w-80 gap-2.5 top-6 right-6 z-50 bg-[#151515] filter  backdrop-blur-xl  text-white p-4 rounded-2xl shadow-[inset_0.1px_0.5px_0.6px_0.5px_rgba(255,255,255,0.2)] text-sm font-medium saturate-200 overflow-hidden">
          <div className=" flex-shrink-0">
            <IconSquareCheckFilled
              size={18}
              strokeWidth={1}
              className="relative top-[5px] text-gray-50"
            />
          </div>
          <div>
            <h1 className="text-lg font-[600] tracking-tight">
              New feed created successfully
            </h1>
            <p className="text-base/5  font-[500] tracking-tight  text-[#555555]   max-w-70 pr-2">
              Try adding your favorite channels to personalize it further.
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
