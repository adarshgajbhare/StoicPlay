import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import AddFeedModal from "../components/AddFeedModal";
import EditFeedModal from "../components/EditFeedModal";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "firebase/firestore";
import { Plus } from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Navbar from "../components/Navbar";
import ImportFeedModal from "../components/ImportFeedModal";

function HomePage() {
  const { user, loading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false); // State for import modal
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

  

  const handleAddFeed = async (feedName, imageUrl) => {
    const newFeed = { name: feedName, image: imageUrl, channels: [] };
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      await updateDoc(userDocRef, {
        feeds: arrayUnion(newFeed),
      });
    } else {
      await setDoc(userDocRef, {
        feeds: [newFeed],
      });
    }

    setFeeds([...feeds, newFeed]);
  };

  const handleUpdateFeed = async (oldName, newName, newImageUrl) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const updatedFeeds = feeds.map((feed) =>
        feed?.name === oldName
          ? { ...feed, name: newName, image: newImageUrl }
          : feed
      );
      const oldFeed = feeds.find((feed) => feed?.name === oldName);
      const newFeed = updatedFeeds.find((feed) => feed?.name === newName);

      await updateDoc(userDocRef, {
        feeds: arrayRemove(oldFeed),
      });
      await updateDoc(userDocRef, {
        feeds: arrayUnion(newFeed),
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFeeds((feeds) => {
        const oldIndex = feeds.findIndex(
          (feed) => `draggable-${feed?.name}` === active.id
        );
        const newIndex = feeds.findIndex(
          (feed) => `draggable-${feed?.name}` === over.id
        );

        const updatedFeeds = arrayMove(feeds, oldIndex, newIndex);

        // Update Firestore with the new order
        const userDocRef = doc(db, "users", user.uid);
        updateDoc(userDocRef, {
          feeds: updatedFeeds,
        });

        return updatedFeeds;
      });
    }
  }

  const handleImportFeed = async (feedUrl) => {
    // TODO: Implement logic to parse the feed URL and add it to the user's feeds
    console.log("Importing feed from URL:", feedUrl);
    // Placeholder for now
    alert(`Importing feed from ${feedUrl}. This feature is not fully implemented yet.`);
  };

  return (
    <div className="min-h-dvh bg-[#101010] text-white">

      <Navbar onImportClick={() => setShowImportModal(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={feeds.map((feed) => `draggable-${feed?.name}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div
                onClick={() => setShowAddModal(true)}
                className="bg-[#101010] shadow-[inset_0px_2px_2px_0px_rgba(255,255,255,0.2)] drop-shadow-[0px_2px_0px_hsla(0,0%,100%,0.15)] h-52 ring-[1px] ring-white/15 rounded-md overflow-hidden cursor-pointer flex text-2xl/6 font-medium tracking-tight text-[#555555]  flex-col items-center justify-center gap-2"
              >
                <Plus size={48} strokeWidth={2} />
                <span className="text-2xl/6 font-medium tracking-tight">
                  Create feed
                </span>
              </div>
              {feeds.map((feed) => (
                <SortableFeedItem key={feed?.name} feed={feed} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

function SortableFeedItem({ feed }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `draggable-${feed?.name}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
    </div>
  );
}

export default HomePage;