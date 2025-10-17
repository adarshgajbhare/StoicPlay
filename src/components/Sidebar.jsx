import { useEffect, useState } from "react";
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
  IconChevronLeft,
  IconBrandYoutube,
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

  const handleLogout = () => setShowLogoutModal(true);
  const handleDeleteAccount = () => setShowDeleteModal(true);
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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

  const confirmDeleteAccount = async () => {
    try {
      if (user) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
        const batch = writeBatch(db);
        
        const collections = ["feeds", "playlists", "liked", "watchLater", "userSubscriptions", "userTokens"];
        for (const collectionName of collections) {
          const q = query(
            collection(db, collectionName),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => batch.delete(doc.ref));
        }

        await batch.delete(doc(db, "users", user.uid));
        await batch.commit();
        await deleteUser(user);
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === "auth/requires-recent-login") {
        alert("For security reasons, please log out and log back in before deleting your account.");
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
      path: "/feeds",
      icon: <IconStack2 size={20} strokeWidth={1.5} />,
      isLink: true,
    },
    {
      name: "Subscriptions",
      path: "/subscriptions",
      icon: <IconBrandYoutube size={20} strokeWidth={1.5} />,
      isLink: true,
    },
    {
      name: "Playlists",
      path: "/playlists",
      icon: <IconPlaylist size={20} strokeWidth={1.5} />,
      isLink: true,
    },
    {
      name: "Liked",
      path: "/liked",
      icon: <IconThumbUp size={20} strokeWidth={1.5} />,
      isLink: true,
    },
    {
      name: "Watch Later",
      path: "/watch-later",
      icon: <IconDeviceTv size={20} strokeWidth={1.5} />,
      isLink: true,
    },
    {
      name: "Import Feed",
      onClick: onImportClick,
      
      icon: <IconDownload size={20} strokeWidth={1.5} />,
      isLink: false,
    },
    {
      name: "Delete Account",
      onClick: handleDeleteAccount, 
      icon: <IconTrash size={20} strokeWidth={1.5} />,
      destructive: true,
      isLink: false,
    },
  ];

  useEffect(() => {
    const event = new CustomEvent('leftSidebarStateChange', {
      detail: { isCollapsed }
    });
    window.dispatchEvent(event);
  }, [isCollapsed]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] md:hidden" 
             onClick={handleBackdropClick} />
      )}

      <aside className={`fixed md:sticky left-0 top-0 z-[999] flex   h-screen flex-col bg-[#121212] transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "md:w-72 w-full"
      } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <span className="text-xl font-bold text-lime-500">{APP_NAME}</span>
          )}
          <button
            onClick={isCollapsed ? toggleCollapse : onClose} title="open"
            className={`rounded-full p-2 hover:bg-zinc-800 ${isCollapsed ? "mx-auto" : "md:hidden"}`} 
          >
            {isCollapsed ? (
              <IconLayoutSidebar  className="h-5 w-5 text-zinc-400" />
            ) : (
              <IconX className="h-5 w-5 text-zinc-400" />
            )}
          </button>
          {!isCollapsed && (
            <button title="close"
              onClick={toggleCollapse}
              className="hidden md:block rounded-full p-2 hover:bg-zinc-800"
            >
              <IconChevronLeft className="h-5 w-5 text-zinc-400" />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-2">
  {navItems.map((item) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.name}
        to={item.path || '#'}
        onClick={() => {
          if (item.isLink) navigate(item.path);
          if (onClose) onClose(); // Close the sidebar
          if (item.onClick) item.onClick();
        }}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
          isActive
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        } ${item.destructive ? "text-red-400 hover:text-red-400" : ""}`}
        title={item.name}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!isCollapsed && <span>{item.name}</span>}
      </Link>
    );
  })}
</nav>


        <div className="mt-auto border-t border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <img
              src={photoError ? "/default-profile.jpeg" : user?.photoURL}
              alt="Profile"
              className="h-8 w-8 rounded-full"
              onError={() => setPhotoError(true)}
            />
            {!isCollapsed && (
              <div className="flex flex-1 items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {user?.displayName?.split(" ")[0] || "User"}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full p-1.5 hover:bg-zinc-800"
                >
                  <IconLogout title="logout" className="h-5 w-5 text-zinc-400" />
                </button>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="mt-4 flex justify-between">
              <a href="https://github.com/adarshgajbhare" target="_blank" className="text-xs text-zinc-400 hover:text-white">ABOUT US</a>
              <a href="https://adarshh.vercel.app/" target="_blank"  className="text-xs text-zinc-400 hover:text-white">CONTACT US</a>
            </div>
          )}
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">Confirm Logout</h2>
            <p className="text-zinc-400 mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] ">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <IconAlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-white">Delete Account</h2>
            </div>
            <p className="text-zinc-400 mb-4">
              Are you absolutely sure you want to delete your account? This action cannot be undone.
            </p>
            <ul className="list-disc list-inside text-zinc-400 mb-4 space-y-1">
              <li>All your saved feeds</li>
              <li>Your playlists</li>
              <li>Your watch history</li>
              <li>Your liked videos</li>
              <li>Your YouTube subscriptions data</li>
              <li>All personalized settings</li>
            </ul>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
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