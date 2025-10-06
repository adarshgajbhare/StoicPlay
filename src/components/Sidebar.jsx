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
        
        const collections = ["feeds", "playlists", "liked", "watchLater"];
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
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden animate-fade-in" 
          onClick={handleBackdropClick} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky left-0 top-0 z-50 flex h-screen flex-col
        liquid-glass-strong border-r border-glass-border
        transition-all duration-slow ease-liquid
        ${isCollapsed ? "w-16" : "md:w-72 w-full"}
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border/50">
          {!isCollapsed && (
            <div className="group cursor-pointer">
              <span className="text-xl font-bold text-neon-blue">
                {APP_NAME}
              </span>
              <div className="h-0.5 w-0 bg-neon-blue rounded-full transition-all duration-medium group-hover:w-full"></div>
            </div>
          )}
          
          <button
            onClick={isCollapsed ? toggleCollapse : onClose} 
            title="Toggle sidebar"
            className={`
              ios-button p-2 transition-all duration-fast
              ${isCollapsed ? "mx-auto" : "md:hidden"}
              hover:bg-glass-white-soft hover:scale-105
            `}
          >
            {isCollapsed ? (
              <IconLayoutSidebar className="h-5 w-5 text-liquid-primary" />
            ) : (
              <IconX className="h-5 w-5 text-liquid-secondary" />
            )}
          </button>
          
          {!isCollapsed && (
            <button 
              title="Collapse sidebar"
              onClick={toggleCollapse}
              className="hidden md:block ios-button p-2 hover:bg-glass-white-soft hover:scale-105"
            >
              <IconChevronLeft className="h-5 w-5 text-liquid-secondary" />
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (item.isLink) navigate(item.path);
                  if (onClose) onClose();
                  if (item.onClick) item.onClick();
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-ios transition-all duration-fast
                  ${
                    isActive
                      ? "liquid-glass-blue text-liquid-primary shadow-neon-blue animate-liquid-glow"
                      : "text-liquid-secondary hover:liquid-glass hover:text-liquid-primary hover:scale-[1.02]"
                  }
                  ${item.destructive ? "hover:text-neon-red" : ""}
                `}
                title={item.name}
              >
                <span className="flex-shrink-0 transition-transform duration-fast group-hover:scale-110">
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="font-medium">
                    {item.name}
                  </span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 bg-neon-blue rounded-full animate-liquid-pulse"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="mt-auto border-t border-glass-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img
                src={photoError ? "/default-profile.jpeg" : user?.photoURL}
                alt="Profile"
                className="h-8 w-8 rounded-full border border-glass-border transition-all duration-fast group-hover:border-neon-blue group-hover:scale-110"
                onError={() => setPhotoError(true)}
              />
              <div className="absolute inset-0 rounded-full bg-neon-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-fast"></div>
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-1 items-center justify-between">
                <span className="text-sm font-medium text-liquid-primary truncate">
                  {user?.displayName?.split(" ")[0] || "User"}
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="ios-button p-1.5 hover:bg-glass-white-soft hover:scale-105"
                >
                  <IconLogout className="h-4 w-4 text-liquid-secondary" />
                </button>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="mt-4 flex justify-between text-xs">
              <a 
                href="https://github.com/adarshgajbhare" 
                target="_blank" 
                className="text-liquid-tertiary hover:text-neon-blue transition-colors duration-fast"
              >
                ABOUT US
              </a>
              <a 
                href="https://adarshh.vercel.app/" 
                target="_blank"  
                className="text-liquid-tertiary hover:text-neon-blue transition-colors duration-fast"
              >
                CONTACT US
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
          <div className="liquid-glass-strong p-6 rounded-ios-lg max-w-md w-full mx-4 border border-glass-border animate-scale-in">
            <h2 className="text-xl font-semibold text-liquid-primary mb-4">Confirm Logout</h2>
            <p className="text-liquid-secondary mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="ios-button px-4 py-2 text-liquid-secondary hover:text-liquid-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="liquid-glass-interactive px-4 py-2 border border-neon-red/30 text-neon-red hover:bg-neon-red/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
          <div className="liquid-glass-strong p-6 rounded-ios-lg max-w-md w-full mx-4 border border-neon-red/30 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-ios bg-neon-red/20">
                <IconAlertTriangle className="h-5 w-5 text-neon-red" />
              </div>
              <h2 className="text-xl font-semibold text-liquid-primary">Delete Account</h2>
            </div>
            
            <p className="text-liquid-secondary mb-4">
              Are you absolutely sure you want to delete your account? This action cannot be undone.
            </p>
            
            <ul className="list-disc list-inside text-liquid-tertiary mb-6 space-y-1">
              <li>All your saved feeds</li>
              <li>Your playlists</li>
              <li>Your watch history</li>
              <li>Your liked videos</li>
              <li>All personalized settings</li>
            </ul>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="ios-button px-4 py-2 text-liquid-secondary hover:text-liquid-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="liquid-glass-interactive px-4 py-2 border border-neon-red/50 text-neon-red hover:bg-neon-red/20"
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