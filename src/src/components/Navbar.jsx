import { IconMenu2, IconX } from "@tabler/icons-react";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

function Navbar({ onImportClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();
  const [photoError, setPhotoError] = useState(false);

  const navItems = [
    { name: 'Feeds', path: '/feeds' },
    { name: 'Playlists', path: '/playlists' },
    { name: 'Liked', path: '/liked' },
    { name: 'Watch Later', path: '/watch-later' }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav className="relative flex items-center justify-between text-white py-3">
      <div className="inline-flex items-center gap-6">
        <span className="text-2xl/4 md:text-xl/4 font-bold italic tracking-tight text-white">
          zenfeeds
        </span>
        <div className="hidden md:flex items-center space-x-2">
          <span className="items-center rounded-full bg-[#555555] px-3 py-0.5 text-sm/6 font-medium tracking-tight text-white inline-flex">
            More new features coming soon
            <span className="inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="relative top-[1px] ml-[1px] size-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </span>
          </span>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-1.5 text-sm/6 font-medium tracking-tight transition-colors ${
                location.pathname === item.path
                  ? 'bg-white text-black rounded-full'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Menu */}
      <div className="hidden items-center gap-8 md:inline-flex">
        <div className="flex items-center space-x-2">
          <img
            src={photoError ? "/default-profile.jpeg" : user.photoURL}
            alt={user.displayName}
            className="size-10 rounded-full ring-[1px] ring-white/50 object-cover"
            onError={() => setPhotoError(true)}
          />
          <span className="text-lg/4 tracking-tight font-medium">
            {user.displayName}
          </span>
        </div>
        <button
          onClick={onImportClick}
          className="rounded-md bg-white px-6 py-4 text-lg/4 font-medium text-gray-950 shadow-[inset_0px_2px_2px_0px_rgba(255,255,255,0.2)] drop-shadow-[0px_2px_0px_hsla(0,0%,100%,0.15)]"
        >
          Import Feed
        </button>
        <button
          onClick={handleLogout}
          className="rounded-md px-6 py-4 text-lg/4 font-medium text-gray-50 ring-[1px] ring-white/20 drop-shadow-md hover:bg-red-800"
        >
          Logout
        </button>
      </div>

      {/* Mobile Menu Button */}
      <div className="inline-flex items-center gap-8 md:hidden">
        <button
          onClick={toggleMenu}
          className="inline-flex cursor-pointer items-center focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? (
            <IconX size={28} className="z-[999] cursor-pointer text-white" />
          ) : (
            <IconMenu2 size={28} className="z-[999] cursor-pointer text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 size-full transform bg-black shadow-lg transition-transform duration-300 ease-out">
            <div className="mt-4 flex flex-col space-y-6 px-8">
              <div className="flex items-center space-x-2">
                <img
                  src={photoError ? "/default-profile.jpeg" : user.photoURL}
                  alt={user.displayName}
                  className="size-10 rounded-full ring-[1px] ring-white/50 object-cover"
                  onError={() => setPhotoError(true)}
                />
                <span className="text-2xl/4 tracking-tight font-medium">
                  {user.displayName}
                </span>
              </div>

              {/* Mobile Navigation */}
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full rounded-md px-6 py-4 text-center text-lg/4 font-medium ${
                      location.pathname === item.path
                        ? 'bg-white text-gray-950'
                        : 'text-white ring-[1px] ring-white/20'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    onImportClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full rounded-md bg-white px-6 py-4 text-center text-lg/4 font-medium text-gray-950"
                >
                  Import Feed
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-md bg-red-600 px-6 py-4 text-center text-lg/4 font-medium text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;