import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { IconMenu2 } from "@tabler/icons-react";

export function Layout({ children, onImportClick }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex bg-[#0F0F0F] relative">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-1/2 -translate-x-1/2  w-[94%]  z-10 flex items-center shadow-[inset_0.1px_0.1px_0.1px_1px_rgba(255,255,255,0.1)] justify-between px-3 py-2 rounded-lg   bg-[#0F0F0F]/60 filter backdrop-blur-sm">
        <div onClick={() => setIsSidebarOpen(true)} className="">
          <span className=" text-lg/4 uppercase font-medium  text-lime-500">
            zenfeeds
          </span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="f">
          <IconMenu2 size={24} className="text-white" />
        </button>
      </div>

      <Sidebar
        onImportClick={onImportClick}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 p-6  md:pl-0 md:pr-6 ">
        <div className="container mx-auto py-12 md:py-0">{children}</div>
      </main>
    </div>
  );
}
