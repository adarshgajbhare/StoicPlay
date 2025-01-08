import {
  IconMenu2,
  IconX,
  IconLogout,
  IconDownload,
} from "@tabler/icons-react";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import DropdownMenu from "./DropdownMenu";

function Navbar({ onImportClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const [photoError, setPhotoError] = useState(false);

  const navItems = [
    { name: "Feeds", path: "/feeds" },
    { name: "Playlists", path: "/playlists" },
    { name: "Liked", path: "/liked" },
    { name: "Watch Later", path: "/watch-later" },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
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
    ],
  ];

  return (
    <nav className="relative max-w-7xl  mx-auto flex items-center justify-between  text-white p-3">
      <div className="inline-flex  items-center gap-3">
        <span className=" text-xl/4 uppercase font-medium  text-lime-500">
          zenfeeds
        </span>
        <div className="hidden md:flex items-center space-x-2">
          <span className="items-center md:hidden rounded-full bg-[#555555] px-3 py-0.5 text-sm/6 font-medium tracking-tight text-white inline-flex">
            More new features coming soon
            <span className="inline-block">
              <svg
                xmlns="
http://www.w3.org/2000/svg
"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="relative top-[1px] ml-[1px] size-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </span>
          </span>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-2 py-[5px] text-base/4  transition-colors ${
                location.pathname === item.path
                  ? "bg-transparent ring-[1px] ring-white/30  text-white rounded-full"
                  : "text-white/75 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Profile menu  & Dropdown */}
      <div className="hidden md:flex items-center gap-8">
        <div
          className="items-center rounded-full cursor-pointer bg-transparent ring-[1px] ring-white/30 px-1.5 py-[5px] text-base/4 gap-1.5
            text-white inline-flex "
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <img
            src={photoError ? "/default-profile.jpeg" : user?.photoURL}
            alt={user?.displayName}
            className="size-[18px] rounded-full ring-[1px] ring-white/50 object-cover"
            onError={() => setPhotoError(true)}
          />
          <span className="">
            {user.displayName}
            <span className="inline-block rotate-90 ml-1">
              <svg
                xmlns="
http://www.w3.org/2000/svg
"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="relative left-[2px] size-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </span>
          </span>
        </div>
        <DropdownMenu
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          items={dropdownItems}
          position="right"
          width="w-48"
        />
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex cursor-pointer items-center focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? (
            <IconX size={28} className="z-[999] cursor-pointer text-white" />
          ) : (
            <IconMenu2
              size={28}
              className="z-[999] cursor-pointer text-white"
            />
          )}
        </button>

        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-0 z-[998] min-h-dvh bg-black px-6 pt-20 ">
          
          
            <div
              className="absolute top-4 left-4 items-center rounded-full cursor-pointer bg-transparent 
               text-2xl gap-1.5
            text-white inline-flex "
            >
              <img
                src={photoError ? "/default-profile.jpeg" : user?.photoURL}
                alt={user?.displayName}
                className="size-[24px] rounded-full ring-[1px] ring-white/50 object-cover"
                onError={() => setPhotoError(true)}
              />

              <span className="">{user.displayName}</span>
            </div>

            <div className="flex flex-col space-y-6 ">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-2xl/4  font-medium tracking-tight ${
                    location.pathname === item.path
                      ? "text-white"
                      : "text-white/60"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={() => {
                  onImportClick();
                  setIsMenuOpen(false);
                }}
                className="rounded-md bg-white px-6 py-4 text-lg/4 font-medium text-gray-950"
              >
                Import Feed
              </button>
              <button
                onClick={handleLogout}
                className="rounded-md px-6 py-4 text-lg/4 font-medium text-white ring-1 ring-white/30"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
