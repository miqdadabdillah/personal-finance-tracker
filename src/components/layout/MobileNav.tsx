'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, PieChart, BarChart3, MoreHorizontal } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budget', icon: PieChart },
  { href: '/statistics', label: 'Statistik', icon: BarChart3 },
  { href: '/settings', label: 'Lainnya', icon: MoreHorizontal },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--sidebar)]/95 backdrop-blur-xl border-t border-[var(--border)] safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                active ? 'text-violet-400' : 'text-[var(--text-muted)]'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-violet-500/20' : ''}`}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
