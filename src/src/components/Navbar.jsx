/* eslint-disable no-unused-vars */
import { IconMenu2, IconX } from "@tabler/icons-react";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

function Navbar({ onImportClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();

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
    <nav className="relative flex items-center justify-between  text-white py-3">
      <div className="inline-flex items-center gap-6">
        <span className=" text-2xl/4 md:text-xl/4 font-bold italic  tracking-tight text-white">
          zenfeeds
        </span>
        <span className="hidden items-center rounded-full bg-[#555555] px-3 py-0.5 text-sm/6 font-medium tracking-tight text-white md:inline-flex">
          <span>More new features coming soon</span>
          <span className="inline-block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
      </div>
      {/* Desktop Menu */}
      <div className="hidden items-center gap-8 md:inline-flex">
        <div className="flex  items-center space-x-2">
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="size-10 rounded-full  ring-[1px] ring-white/50 object-cover"
          />
          <span className="text-lg/4 tracking-tight  font-medium">
            {user.displayName}
          </span>
        </div>
        <button
            onClick={onImportClick}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-3"
          >
            Import Feed
          </button>
        <button
          onClick={handleLogout}
          className="rounded-md px-6 py-4 text-lg/4 font-medium text-gray-50 ring-[1px] ring-white/20  drop-shadow-md flex items-center hover:bg-red-800"
        >
          Logout
        </button>
      </div>

      {/* Mobile Menu */}
      <div className="inline-flex items-center gap-8 md:hidden">
        <button
          onClick={toggleMenu}
          className="inline-flex cursor-pointer items-center text-black hover:text-gray-700 focus:outline-none focus:ring md:hidden"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? (
            <IconX size={28} className="z-[999] cursor-pointer text-white" />
          ) : (
            <IconMenu2
              size={28}
              className="z-[999] cursor-pointer  text-white"
            />
          )}
        </button>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className={`absolute inset-0 size-full transform bg-black shadow-lg transition-transform duration-300 ease-out ${
                isMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="mt-4 flex flex-col space-y-6 px-8">
              
                <div className="hero-buttons  flex flex-col items-center gap-6 md:w-full md:flex-row">
                <div className="flex self-start  items-center space-x-2">
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="size-10 rounded-full  ring-[1px] ring-white/50 object-cover"
          />
          <span className="text-2xl/4 tracking-tight  font-medium">
            {user.displayName}
          </span>
        </div>
      
                  <a
                    href="/learn-more"
                    className="w-full rounded-md bg-white px-6 py-4 text-center text-lg/4 font-medium text-gray-950 shadow-[inset_0_0_1px_1px_rgba(0,0,0,0.25)] ring-[1px] ring-[#D1F052]/15 drop-shadow-md md:w-fit"
                  >
                    Learn more
                  </a>
                  <button
          onClick={handleLogout}
          className="rounded-md px-6 w-full text-center py-4 text-lg/4 font-medium text-gray-50 ring-[1px] ring-white/20  drop-shadow-md  bg-red-600"
        >
          Logout
        </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
