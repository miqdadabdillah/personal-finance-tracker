import React from 'react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <main className="md:ml-60 min-h-screen pb-24 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
