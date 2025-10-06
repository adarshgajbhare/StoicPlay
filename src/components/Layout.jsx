/* eslint-disable react/prop-types */
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { IconMenu2 } from "@tabler/icons-react";
import { APP_NAME } from "../utils/constant";

export function Layout({ children, onImportClick }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex relative overflow-hidden">
      {/* Liquid Glass Background Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-liquid-gradient bg-[400%_400%] animate-liquid-gradient" />
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-transparent to-neon-purple/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-pink/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Mobile Glass Navigation Header */}
      <div className="md:hidden fixed top-4 left-1/2 -translate-x-1/2 w-[94%] z-50 animate-slide-in-bottom">
        <div className="glass-nav flex items-center justify-between px-6 py-4 rounded-glass-lg">
          <div 
            onClick={() => setIsSidebarOpen(true)} 
            className="cursor-pointer liquid-interactive"
          >
            <span className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent uppercase tracking-wider">
              {APP_NAME}
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="glass-button p-3 rounded-xl neon-glow glass-focus"
          >
            <IconMenu2 size={20} className="text-glass" />
          </button>
        </div>
      </div>

      {/* Glass Morphism Sidebar */}
      <Sidebar
        onImportClick={onImportClick}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content with Glass Container */}
      <main className="flex-1 relative z-10 p-0 md:pt-6 md:pl-0 md:pr-6">
        <div className="container mx-auto py-16 md:py-0 px-4">
          {/* Glass Content Wrapper */}
          <div className="glass-soft rounded-glass-lg p-1 animate-fade-in">
            <div className="bg-glass-soft/30 rounded-glass backdrop-blur-glass-lg">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Glass Orbs for Ambient Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-neon-blue/10 rounded-full blur-xl animate-liquid-float" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-neon-purple/10 rounded-full blur-lg animate-liquid-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-neon-pink/10 rounded-full blur-lg animate-liquid-float" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-neon-green/10 rounded-full blur-md animate-liquid-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Mobile Overlay for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 frosted-overlay z-40 animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}