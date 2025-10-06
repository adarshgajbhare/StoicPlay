/* eslint-disable react/prop-types */
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { IconMenu2 } from "@tabler/icons-react";
import { APP_NAME } from "../utils/constant";

export function Layout({ children, onImportClick }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex bg-liquid-black relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-liquid-float"></div>
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl animate-liquid-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-neon-pink/5 rounded-full blur-3xl animate-liquid-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed top-4 left-1/2 -translate-x-1/2 w-[94%] z-50 animate-fade-in">
        <div className="liquid-glass px-4 py-3 flex items-center justify-between">
          <div 
            onClick={() => setIsSidebarOpen(true)} 
            className="cursor-pointer group"
          >
            <span className="text-lg font-semibold text-liquid-primary group-hover:text-neon-blue transition-colors duration-fast">
              {APP_NAME}
            </span>
            <div className="h-0.5 w-0 bg-neon-blue rounded-full transition-all duration-medium group-hover:w-full"></div>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="liquid-glass-interactive p-2.5 rounded-ios"
            aria-label="Open menu"
          >
            <IconMenu2 size={20} className="text-liquid-primary" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        onImportClick={onImportClick}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Content Container */}
        <div className="min-h-screen p-0 md:pt-6 md:pl-0 md:pr-6">
          <div className="container mx-auto py-16 md:py-0 relative z-10">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}