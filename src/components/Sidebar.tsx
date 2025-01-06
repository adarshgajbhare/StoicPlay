import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { IconMenu2, IconX, IconLogout, IconDownload, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { signOut } from "firebase/auth"
import { auth } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import DropdownMenu from "./DropdownMenu"
import React from "react"

interface SidebarProps {
  onImportClick: () => void
}

export function Sidebar({ onImportClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  const navItems = [
    { name: "Feeds", path: "/feeds" },
    { name: "Playlists", path: "/playlists" },
    { name: "Liked", path: "/liked" },
    { name: "Watch Later", path: "/watch-later" },
  ]

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

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
  ]

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen bg-[#100C08] transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between gap-2  border-white/10 px-4">
          <span className={`text-xl/4 uppercase font-semibold text-lime-500 transition-opacity ${isCollapsed ? "opacity-0" : "opacity-100"}`}>
            zenfeeds
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 hover:bg-white/10"
          >
            {isCollapsed ? <IconChevronRight size={20} /> : <IconChevronLeft size={20} />}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                location.pathname === item.path
                  ? "bg-white/10 text-white"
                  : "text-white/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={`transition-all ${isCollapsed ? "w-full text-center" : ""} `}>
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <div
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5"
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
                <span className="text-sm font-medium text-white">{user?.displayName}</span>
                <IconChevronRight size={16} className="text-white/50" />
              </div>
            )}
          </div>
          <DropdownMenu
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            items={dropdownItems}
            position="top"
            width="w-48"
          />
        </div>
      </div>
    </aside>
  )
}
