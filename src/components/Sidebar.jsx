/* eslint-disable react/prop-types */
import { useState } from "react";
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
import { APP_NAME } from "../utils/constant";

export function Sidebar({ onImportClick, isOpen, onClose }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setShowLogoutModal(false);
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
      icon: <IconStack2 size={20} strokeWidth={1} className="" />,
      isLink: true,
    },
    {
      name: "Playlists",
      onClick: onClose,
      path: "/playlists",
      icon: <IconPlaylist size={20} strokeWidth={1} className="" />,
      isLink: true,
    },
    {
      name: "Liked",
      onClick: onClose,
      path: "/liked",
      icon: <IconThumbUp size={20} strokeWidth={1} className="" />,
      isLink: true,
    },
    {
      name: "Watch Later",
      onClick: onClose,
      path: "/watch-later",
      icon: <IconDeviceTv size={20} strokeWidth={1} className="" />,
      isLink: true,
    },

    {
      name: "Import Feed",
      onClick: onImportClick,
      icon: <IconDownload size={20} strokeWidth={1} className="" />,
      isLink: false,
    },
    {
      name: "Delete Account",
      onClick: handleDeleteAccount,
      icon: <IconTrash size={20} strokeWidth={1} className="" />,
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
        className={`fixed md:sticky left-0 top-0 z-40 flex h-svh p-5  items-center  text-xl/4  justify-between  flex-col  bg-black transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-full md:w-72"
        } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div
          className={`flex text-xl/4  mt-2  flex-shrink-0  py-2  rounded-full w-full items-center ${
            isCollapsed ? "md:justify-center" : "md:justify-between"
          }`}
        >
          <span
            className={`text-xl/4    uppercase  font-bold  text-lime-500 transition-opacity ${
              isCollapsed ? "hidden" : "block"
            }`}
          >
            {APP_NAME}
          </span>
          <button
            onClick={onClose}
            className="md:hidden bg-white/10   size-8  shadow-[inset_0.1px_0.2px_0.5px_0.5px_rgba(255,255,255,0.2)] flex items-center justify-center rounded-full ml-auto hover:bg-white/10"
          >
            <IconX size={20} className="text-white  " strokeWidth={1} />
          </button>

          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex  bg-white/10  size-8 flex-shrink-0  shadow-[inset_0.1px_0.2px_0.5px_0.5px_rgba(255,255,255,0.2)]  items-center text-white justify-center rounded-full  hover:bg-white/10"
            >
              <IconLayoutSidebar
                size={20}
                className=" "
                strokeWidth={1}
              />
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex  bg-white/10  size-8  shadow-[inset_0.1px_0.2px_0.5px_0.5px_rgba(255,255,255,0.2)]  items-center text-white justify-center rounded-full  hover:bg-white/10"
            >
              <IconX size={20} className=" " strokeWidth={1} />
            </button>
          )}
        </div>

        <div className="flex text-xl/4  mb-auto rounded-[2.5rem]  py-4 flex-col w-full">
          {navItems.map((item) => (
            <Link
              to={item.path}
              key={item.name}
              onClick={
                item.onClick || (item.isLink && (() => navigate(item.path)))
              }
              className={`flex items-center  w-full justify-between text-lg/4  py-1.5 rounded-full  text-nowrap  font-bold uppercase tracking-tight transition-colors ${
                location.pathname === item.path
                  ? " text-slate-50"
                  : "text-[#555555]  "
              }  
                ${
                  item.name === "Delete Account"
                    ? " text-red-400"
                    : "text-[#555555]  "
                }
                `}
            >
              {!isCollapsed && <span>{item.name}</span>}

              <div
                className={`flex items-center flex-shrink-0 shadow-[inset_0.1px_0.2px_0.5px_0.5px_rgba(255,255,255,0.2)] justify-center bg-white/10 rounded-full   size-8   ${
                  location.pathname === item.path
                    ? " text-slate-50"
                    : "text-[#555555]  "
                }
                 ${
                   item.name === "Delete Account"
                     ? " text-red-400"
                     : "text-[#555555]  "
                 }
                `}
              >
                {item.icon}
                {/* <IconArrowRight
                    size={24}
                    className={`  relative  ${
                      location.pathname === item.path
                        ? " text-slate-50"
                        : "text-[#555555]  "
                    }`}
                    strokeWidth={1}
                  /> */}
              </div>
            </Link>
          ))}
        </div>

        <div className="w-full">
          <div className="flex text-xl/4  cursor-pointer items-center justify-center gap-3  py-2 rounded-full hover:bg-white/5">
            <img
              src={photoError ? "/default-profile.jpeg" : user?.photoURL}
              alt={"Profile"}
              className="size-8 rounded-full ring-1 ring-white/20"
              onError={() => setPhotoError(true)}
            />
            {!isCollapsed && (
              <div className="flex flex-1 items-center justify-between">
                <span className="text-xl/4   uppercase font-bold  text-slate-50">
                  {user?.displayName?.split(" ")?.[0] || "John Doe"}
                </span>
                <div className="bg-white/10  size-8   shadow-[inset_0.1px_0.2px_0.5px_0.5px_rgba(255,255,255,0.2)] flex items-center justify-center rounded-full ml-auto hover:bg-white/10">
                  <IconLogout
                    size={20}
                    className="text-white relative left-[1px]"
                    strokeWidth={1}
                    onClick={handleLogout}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="inline-flex py-4  items-center justify-between w-full">
            <span className="text-[#555555] font-bold  tracking-tight text-xl/4">
              ABOUT US
            </span>
            <span className="text-[#555555] font-bold  tracking-tight text-xl/4">
              CONTACT US
            </span>
          </div>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1F1F1F] p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">
              Confirm Logout
            </h2>
            <p className="text-gray-300 mb-4">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1F1F1F] p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <IconAlertTriangle size={24} className="text-red-500 mr-2" />
              <h2 className="text-xl font-bold text-white">Delete Account</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Are you absolutely sure you want to delete your account? This
              action cannot be undone and will result in the permanent loss of:
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
