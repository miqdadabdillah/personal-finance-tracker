'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  BarChart3,
  Settings,
  Layers,
  TrendingUp,
  HardDrive,
} from 'lucide-react'
import { useFileStatus } from '@/hooks/useFileStatus'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/wallets', label: 'Dompet', icon: Wallet },
  { href: '/budgets', label: 'Budget', icon: PieChart },
  { href: '/statistics', label: 'Statistik', icon: BarChart3 },
  { href: '/allocation', label: 'Alokasi', icon: Layers },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { connected, name } = useFileStatus()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[var(--sidebar)] border-r border-[var(--border)] fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)] text-sm leading-tight">Finance</p>
            <p className="text-xs text-[var(--text-muted)] leading-tight">Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-violet-400 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 transition-colors ${
                  active ? 'text-violet-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                }`}
                size={18}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--border)]">
        {mounted && connected && name ? (
          <div
            className="flex items-center gap-1.5 justify-center text-xs text-emerald-400"
            title="Tersimpan otomatis ke file lokal di drive"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <HardDrive size={12} className="shrink-0" />
            <span className="truncate max-w-[8rem]">{name}</span>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] text-center">Data tersimpan secara lokal</p>
        )}
      </div>
    </aside>
  )
}
