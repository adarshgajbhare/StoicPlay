/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  IconX,
  IconLogout,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconRss,
  IconPlaylist,
  IconHeart,
  IconClock,
  IconTrash,
  IconThumbUp,
  IconStack,
  IconStack2,
  IconDeviceTv,
  IconLogout2,
  IconCloudDownload,
} from "@tabler/icons-react";
import {
  signOut,
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import DropdownMenu from "./DropdownMenu";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";

export function Sidebar({ onImportClick, isOpen, onClose }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      name: "Feeds",
      path: "/feeds",
      icon: (
        <IconStack2 size={24} strokeWidth={1.5} className="text-gray-500" />
      ),
    },
    {
      name: "Playlists",
      path: "/playlists",
      icon: (
        <IconPlaylist size={24} strokeWidth={1.5} className="text-gray-500" />
      ),
    },
    {
      name: "Liked",
      path: "/liked",
      icon: (
        <IconThumbUp size={24} strokeWidth={1.5} className="text-gray-500" />
      ),
    },
    {
      name: "Watch Later",
      path: "/watch-later",
      icon: (
        <IconDeviceTv size={24} strokeWidth={1.5} className="text-gray-500" />
      ),
    },
    {
      name: "Import Feed",
      path: "/watch-later",
      icon: (
        <IconCloudDownload size={24} strokeWidth={1.5} className="text-gray-500" />
      ),
    },
    {
      name: "Delete Account",
      path: "/watch-later",
      icon: (
        <IconTrash size={24} strokeWidth={1.5} className="text-gray-500" />
      ),
    },
    {
      name: "Logout",
      path: "/watch-later",
      icon: (
        <IconLogout size={24} strokeWidth={1.5} className="text-gray-500" />
      ),
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
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
      }
    }
  };

  const dropdownItems = [
    [
      {
        label: "Import Feed",
        icon: <IconDownload size={22} />,
        onClick: onImportClick,
      },
      {
        label: "Logout",
        icon: <IconLogout size={22} />,
        onClick: handleLogout,
        destructive: true,
      },
      {
        label: "Delete Account",
        icon: <IconTrash size={22} />,
        onClick: handleDeleteAccount,
        destructive: true,
      },
    ],
  ];

  // Handle click outside on mobile
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
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
        <div className="flex h-full  flex-col">
          <div className="flex h-16 items-center justify-between  px-4">
            <span
              className={`text-xl/4 uppercase font-bold  text-lime-500 transition-opacity ${
                isCollapsed ? "hidden" : "block"
              }`}
            >
              zenfeeds
            </span>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="md:hidden rounded-lg p-1.5 ml-auto hover:bg-white/10"
            >
              <IconX size={24} className="text-white" />
            </button>
            {/* Desktop collapse button */}

            <div className="flex">
              {isCollapsed ? (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:block text-white"
                >
                  <IconChevronRight size={28} className="ml-5 " />
                </button>
              ) : (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:block  text-white"
                >
                  <IconChevronLeft size={28} className="ml-auto " />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-start gap-3 rounded-lg p-4 text-lg/4 font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-white/10 text-white"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div
                  className={`flex items-center justify-center ${
                    isCollapsed ? "w-full" : ""
                  }`}
                >
                  {item.icon}
                </div>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <div
              className="flex cursor-pointer items-center justify-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <img
                src={photoError ? "/default-profile.jpeg" : user?.photoURL}
                alt={user?.displayName}
                className="h-8 w-8 rounded-full ring-1 ring-white/20"
                onError={() => setPhotoError(true)}
              />
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-lg/4 font-medium text-white">
                    {user?.displayName?.split(" ")?.[0] || "John Doe"}
                  </span>
                  <IconChevronRight size={24} className="text-white/50" />
                </div>
              )}
            </div>
            <DropdownMenu
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              items={dropdownItems}
              position="top"
              width={isCollapsed ? "w-56" : "w-48"}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
