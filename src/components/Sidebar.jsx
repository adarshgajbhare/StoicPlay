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
      gradient: "from-neon-blue to-neon-purple"
    },
    {
      name: "Playlists",
      path: "/playlists",
      icon: <IconPlaylist size={20} strokeWidth={1.5} />,
      isLink: true,
      gradient: "from-neon-purple to-neon-pink"
    },
    {
      name: "Liked",
      path: "/liked",
      icon: <IconThumbUp size={20} strokeWidth={1.5} />,
      isLink: true,
      gradient: "from-neon-pink to-neon-orange"
    },
    {
      name: "Watch Later",
      path: "/watch-later",
      icon: <IconDeviceTv size={20} strokeWidth={1.5} />,
      isLink: true,
      gradient: "from-neon-green to-neon-blue"
    },
    {
      name: "Import Feed",
      onClick: onImportClick,
      icon: <IconDownload size={20} strokeWidth={1.5} />,
      isLink: false,
      gradient: "from-neon-orange to-neon-purple"
    },
    {
      name: "Delete Account",
      onClick: handleDeleteAccount, 
      icon: <IconTrash size={20} strokeWidth={1.5} />,
      destructive: true,
      isLink: false,
      gradient: "from-red-400 to-red-600"
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
      {/* Mobile Overlay with Frosted Glass Effect */}
      {isOpen && (
        <div className="fixed inset-0 frosted-overlay z-[999] md:hidden animate-fade-in" 
             onClick={handleBackdropClick} />
      )}

      {/* Main Sidebar with Liquid Glass Design */}
      <aside className={`fixed md:sticky left-0 top-0 z-[1000] flex h-screen flex-col glass-sidebar transition-all duration-500 ease-liquid ${
        isCollapsed ? "w-20" : "md:w-80 w-full"
      } ${
        isOpen ? "translate-x-0 animate-slide-in-right" : "-translate-x-full md:translate-x-0"
      }`}>
        
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-glass-white/5 via-transparent to-glass-white/10 animate-liquid-gradient" />
        
        {/* Header Section */}
        <div className="relative flex items-center justify-between p-6 border-b border-glass-white/20">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple p-0.5">
                <div className="w-full h-full rounded-lg glass flex items-center justify-center">
                  <span className="text-sm font-bold text-glass">S</span>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent uppercase tracking-wider">
                {APP_NAME}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={isCollapsed ? toggleCollapse : onClose}
              title={isCollapsed ? "Expand" : "Close"}
              className={`glass-button p-3 rounded-xl neon-glow glass-focus ${
                isCollapsed ? "mx-auto" : "md:hidden"
              }`}
            >
              {isCollapsed ? (
                <IconLayoutSidebar className="h-5 w-5 text-glass" />
              ) : (
                <IconX className="h-5 w-5 text-glass" />
              )}
            </button>
            
            {!isCollapsed && (
              <button
                title="Collapse"
                onClick={toggleCollapse}
                className="hidden md:block glass-button p-3 rounded-xl glass-focus"
              >
                <IconChevronLeft className="h-5 w-5 text-glass" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-2 relative overflow-y-auto">
          {navItems.map((item, index) => {
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
                className={`group relative flex items-center gap-4 rounded-glass px-4 py-4 transition-all duration-300 liquid-interactive ${
                  isActive
                    ? "glass-strong neon-glow text-glass"
                    : "glass-soft hover:glass-strong text-glass/80 hover:text-glass"
                } ${
                  item.destructive ? "hover:border-red-400/50" : ""
                }`}
                title={item.name}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon with Gradient Effect */}
                <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-br ${item.gradient} bg-opacity-20`}>
                  <div className="text-glass group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                </div>
                
                {/* Navigation Text */}
                {!isCollapsed && (
                  <div className="flex-1">
                    <span className="font-medium text-glass group-hover:text-white transition-colors duration-300">
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="mt-1 h-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full animate-pulse-glow" />
                    )}
                  </div>
                )}
                
                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-glass bg-gradient-to-r from-transparent via-glass-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="relative mt-auto border-t border-glass-white/20 p-4">
          <div className="glass-soft rounded-glass p-4">
            <div className="flex items-center gap-4">
              {/* Profile Picture with Glass Frame */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-neon-blue to-neon-purple">
                  <img
                    src={photoError ? "/default-profile.jpeg" : user?.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    onError={() => setPhotoError(true)}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-neon-green to-neon-blue rounded-full animate-pulse-glow" />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-glass text-sm truncate">
                        {user?.displayName?.split(" ")[0] || "User"}
                      </p>
                      <p className="text-glass/60 text-xs truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="glass-button p-2 rounded-lg neon-glow glass-focus"
                      title="Logout"
                    >
                      <IconLogout className="h-4 w-4 text-glass" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="mt-4 flex justify-between text-xs">
                <a 
                  href="https://github.com/adarshgajbhare" 
                  target="_blank"
                  className="text-glass/60 hover:text-neon-blue transition-colors duration-300 font-medium"
                >
                  ABOUT US
                </a>
                <a 
                  href="https://adarshh.vercel.app/" 
                  target="_blank"
                  className="text-glass/60 hover:text-neon-purple transition-colors duration-300 font-medium"
                >
                  CONTACT US
                </a>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Modal with Glass Design */}
      {showLogoutModal && (
        <div className="fixed inset-0 frosted-overlay flex items-center justify-center z-[1001] animate-fade-in">
          <div className="glass-modal p-8 max-w-md w-full mx-4 animate-slide-in-bottom">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-neon-orange to-neon-pink p-0.5">
                <div className="w-full h-full rounded-full glass flex items-center justify-center">
                  <IconLogout className="h-8 w-8 text-glass" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-glass mb-4">Confirm Logout</h2>
              <p className="text-glass/80 mb-8">Are you sure you want to log out?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 glass-button px-6 py-3 rounded-glass text-glass font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 glass-button px-6 py-3 rounded-glass bg-gradient-to-r from-red-400/20 to-red-600/20 border-red-400/50 text-red-300 font-medium neon-glow"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal with Glass Design */}
      {showDeleteModal && (
        <div className="fixed inset-0 frosted-overlay flex items-center justify-center z-[1001] animate-fade-in">
          <div className="glass-modal p-8 max-w-md w-full mx-4 animate-slide-in-bottom">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 p-0.5">
                <div className="w-full h-full rounded-full glass flex items-center justify-center">
                  <IconAlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-glass mb-4">Delete Account</h2>
              <p className="text-glass/80 mb-6">
                Are you absolutely sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="glass-soft rounded-glass p-4 mb-6 text-left">
                <p className="text-sm text-glass/80 mb-3 font-medium">This will permanently delete:</p>
                <ul className="text-sm text-glass/70 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    All your saved feeds
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Your playlists
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Your watch history
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Your liked videos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    All personalized settings
                  </li>
                </ul>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 glass-button px-6 py-3 rounded-glass text-glass font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 glass-button px-6 py-3 rounded-glass bg-gradient-to-r from-red-400/20 to-red-600/20 border-red-400/50 text-red-300 font-medium neon-glow"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}