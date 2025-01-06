import { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import React from "react"

interface LayoutProps {
  children: ReactNode
  onImportClick: () => void
}

export function Layout({ children, onImportClick }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#100C08]">
      <Sidebar onImportClick={onImportClick} />
      <main className="pl-64 transition-all">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
