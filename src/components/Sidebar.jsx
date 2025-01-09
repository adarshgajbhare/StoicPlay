import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  IconX,
  IconLogout,
  IconDownload,
  IconPlaylist,
  IconTrash,
  IconThumbUp,
  IconStack2,
  IconDeviceTv,
  IconLayoutSidebar,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  signOut,
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";

export function Sidebar({ onImportClick, isOpen, onClose }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      if (user) {
        const provider = new GoogleAuthProvider();

        // Re-authenticate the user
        await reauthenticateWithPopup(user, provider);

        const batch = writeBatch(db);

        // Delete user-specific data
        const collections = ["feeds", "playlists", "liked", "watchLater"];
        for (const collectionName of collections) {
          const q = query(
            collection(db, collectionName),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => batch.delete(doc.ref));
        }

        // Delete user document
        const userDoc = doc(db, "users", user.uid);
        batch.delete(userDoc);

        // Commit the batch
        await batch.commit();

        // Delete the user from Firebase Auth
        await deleteUser(user);
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === "auth/requires-recent-login") {
        alert(
          "For security reasons, please log out and log back in before deleting your account."
        );
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } finally {
      setShowDeleteModal(false);
    }
  };

  const navItems = [
    {
      name: "Feeds",
      onClick: onClose,
      path: "/feeds",
      icon: <IconStack2 size={24} strokeWidth={1.5} className="text-gray-500" />,
      isLink: true,
    },
    {
      name: "Playlists",
      onClick: onClose,
      path: "/playlists",
      icon: <IconPlaylist size={24} strokeWidth={1.5} className="text-gray-500" />,
      isLink: true,
    },
    {
      name: "Liked",
      onClick: onClose,
      path: "/liked",
      icon: <IconThumbUp size={24} strokeWidth={1.5} className="text-gray-500" />,
      isLink: true,
    },
    {
      name: "Watch Later",
      onClick: onClose,
      path: "/watch-later",
      icon: <IconDeviceTv size={24} strokeWidth={1.5} className="text-gray-500" />,
      isLink: true,
    },
    {
      name: "Import Feed",
      onClick: onImportClick,
      icon: <IconDownload size={22} strokeWidth={1.5} className="text-gray-500"  />,
      isLink: false,
    },
    {
      name: "Delete Account",
      onClick: handleDeleteAccount,
      icon: <IconTrash size={22}  strokeWidth={1.5} className="text-gray-500" />,
      destructive: true,
      isLink: false,
    },
  ];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={handleBackdropClick}
        />
      )}

      <aside
        className={`fixed md:sticky left-0 top-0 z-40 h-dvh bg-[#0F0F0F] transition-all duration-300 ${
          isCollapsed ? "w-24" : "w-full md:w-64"
        } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-4">
            <span
              className={`text-xl/4 uppercase font-bold text-lime-500 transition-opacity ${
                isCollapsed ? "hidden" : "block"
              }`}
            >
              zenfeeds
            </span>
            <button
              onClick={onClose}
              className="md:hidden rounded-lg p-1.5 ml-auto hover:bg-white/10"
            >
              <IconX size={24} className="text-white" />
            </button>
            <div className="flex">
              {isCollapsed ? (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:block text-white"
                >
                  <IconLayoutSidebar size={28} className="ml-5" strokeWidth={1}/>
                </button>
              ) : (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:block text-white"
                >
                  <IconLayoutSidebar size={28} className="ml-auto" strokeWidth={1} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Link
                to={item.path}
                key={item.name}
                onClick={item.onClick || (item.isLink && (() => navigate(item.path)))}
                className={`flex items-center justify-start gap-3 rounded-lg p-4 text-lg/4 font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-white/10 text-white"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon}
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <div
              className="flex cursor-pointer items-center justify-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5"
            >
              <img
                src={photoError ? "/default-profile.jpeg" : user?.photoURL}
                alt={"Profile"}
                className="h-8 w-8 rounded-full ring-1 ring-white/20"
                onError={() => setPhotoError(true)}
              />
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-lg/4 font-medium text-white">
                    {user?.displayName?.split(" ")?.[0] || "John Doe"}
                  </span>
                  <IconLogout onClick={handleLogout} size={24} className="text-white/50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1F1F1F] p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <IconAlertTriangle size={24} className="text-red-500 mr-2" />
              <h2 className="text-xl font-bold text-white">Delete Account</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Are you absolutely sure you want to delete your account? This action cannot be undone and will result in the permanent loss of:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>All your saved feeds</li>
              <li>Your playlists</li>
              <li>Your watch history</li>
              <li>Your liked videos</li>
              <li>All personalized settings and preferences</li>
            </ul>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

