import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import React from "react";

interface LayoutProps {
  children: ReactNode;
  onImportClick: () => void;
}

export function Layout({ children, onImportClick }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-[#100C08]">
      <Sidebar onImportClick={onImportClick} onToggle={handleSidebarToggle} />
      <main
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? "pl-24" : "pl-64"
        }`}
      >
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}