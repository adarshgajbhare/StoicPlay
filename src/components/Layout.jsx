import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { IconMenu2 } from "@tabler/icons-react";

export function Layout({ children, onImportClick }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex bg-[#0F0F0F] relative">
      {/* Mobile menu button */}
      <div
        onClick={() => setIsSidebarOpen(true)}
        className="fixed left-4 top-4 md:hidden"
      >
        <span className=" text-lg/4 uppercase font-semibold text-lime-500">
          zenfeeds
        </span>
      </div>
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed right-4 top-4 md:hidden"
      >
        <IconMenu2 size={24} className="text-white" />
      </button>

      <Sidebar
        onImportClick={onImportClick}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 p-4 md:p-6 pt-12 ">
        <div className="container mx-auto">{children}</div>
      </main>
    </div>
  );
}

