/* eslint-disable react/prop-types */
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { IconMenu2 } from "@tabler/icons-react";
import { APP_NAME } from "../utils/constant";

export function Layout({ children, onImportClick }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex relative overflow-hidden bg-[#0a0a0a]">
      {/* Professional Dark Theme Background - Minimal and Subtle */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Very subtle ambient lighting effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/[0.01] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-slate-400/[0.008] rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Mobile Professional Navigation Header */}
      <div className="md:hidden fixed top-4 left-4 right-4 z-50 animate-slide-in-bottom">
        <div className="glass-nav flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="cursor-pointer liquid-interactive">
            <span className="text-lg sm:text-xl font-bold text-glass uppercase tracking-wider">
              {APP_NAME}
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="glass-button p-2 sm:p-3 rounded-lg accent-glow glass-focus"
            aria-label="Open menu"
          >
            <IconMenu2 size={20} className="text-glass" />
          </button>
        </div>
      </div>

      {/* Professional Glass Morphism Sidebar */}
      <Sidebar
        onImportClick={onImportClick}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content with Responsive Layout */}
      <main className="flex-1 relative z-10 w-full">
        {/* Mobile padding to avoid navbar overlap */}
        <div className="pt-20 md:pt-6 px-4 sm:px-6 md:pl-0 md:pr-6 lg:pr-8">
          <div className="container mx-auto max-w-none">
            {/* Professional Glass Content Wrapper */}
            <div className="glass-subtle rounded-lg sm:rounded-xl animate-fade-in overflow-hidden">
              <div className="bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-glass rounded-lg sm:rounded-xl">
                {/* Responsive content padding */}
                <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Professional Ambient Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Minimal floating orbs for depth */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-blue-500/[0.008] rounded-full blur-xl animate-float opacity-60" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-slate-400/[0.006] rounded-full blur-lg animate-float opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-emerald-500/[0.005] rounded-full blur-lg animate-float opacity-30" style={{ animationDelay: '3s' }} />
      </div>

      {/* Mobile Overlay for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 frosted-overlay z-40 animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}
    </div>
  );
}