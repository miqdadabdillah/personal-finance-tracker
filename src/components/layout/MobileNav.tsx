'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Wallet, PieChart, BarChart3, MoreHorizontal, Layers, Settings, ChevronUp } from 'lucide-react'

const moreItems = [
  { href: '/allocation', label: 'Alokasi', icon: Layers },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [])

  const navItems = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
    { href: '/wallets', label: 'Dompet', icon: Wallet },
    { href: '/budgets', label: 'Budget', icon: PieChart },
    { href: '/statistics', label: 'Statistik', icon: BarChart3 },
  ]

  const moreActive = moreItems.some((item) => pathname === item.href)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--sidebar)]/95 backdrop-blur-xl border-t border-[var(--border)] safe-bottom">
      <div className="flex items-center justify-around px-1 py-2" ref={moreRef}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all duration-200 ${
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

        <div className="relative">
          {open && (
            <div className="absolute bottom-full right-0 mb-24 w-44 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden animate-fade-in z-50">
              {moreItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? 'text-violet-400 bg-violet-500/10'
                        : 'text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all duration-200 ${
              open || moreActive ? 'text-violet-400' : 'text-[var(--text-muted)]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${open || moreActive ? 'bg-violet-500/20' : ''}`}>
              {open ? <ChevronUp size={20} /> : <MoreHorizontal size={20} />}
            </div>
            <span className="text-[10px] font-medium leading-none">Lainnya</span>
          </button>
        </div>
      </div>
    </nav>
  )
}