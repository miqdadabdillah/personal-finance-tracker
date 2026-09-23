'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import QuickAdd from '../dashboard/QuickAdd'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <main className="md:ml-60 min-h-screen pb-24 md:pb-0">
        {children}
      </main>
      <MobileNav onAdd={() => setQuickAddOpen(true)} />
      <QuickAdd open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  )
}