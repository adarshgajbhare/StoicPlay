import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import React from "react";

interface LayoutProps {
  children: ReactNode;
  onImportClick: () => void;
  channelSidebar?: ReactNode; // Added to support channel sidebar
}

export function Layout({ children, onImportClick, channelSidebar }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChannelSidebarCollapsed, setIsChannelSidebarCollapsed] = useState(false); // Added state for channel sidebar

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

    const handleChannelSidebarToggle = () => {
      setIsChannelSidebarCollapsed(!isChannelSidebarCollapsed)
    }

  return (
    <div className="min-h-screen bg-[#100C08] relative">
      <Sidebar onImportClick={onImportClick} onToggle={handleSidebarToggle} />
        {channelSidebar && <div className={`transition-all duration-300 absolute top-0 right-0 z-10  ${isChannelSidebarCollapsed ? 'w-16' : 'w-full md:w-64'} h-full`}>{React.cloneElement(channelSidebar, { isCollapsed: isChannelSidebarCollapsed, onCollapse: handleChannelSidebarToggle })}</div>}
      <main
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? "pl-24" : "pl-64"
        } `}
      >
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}