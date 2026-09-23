'use client'

import React from 'react'
import Link from 'next/link'
import { Transaction, Category, Wallet } from '@/types/finance'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'

interface RecentTransactionsProps {
  transactions: Transaction[]
  categories: Category[]
  wallets: Wallet[]
}

export default function RecentTransactions({
  transactions,
  categories,
  wallets,
}: RecentTransactionsProps) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w]))

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Transaksi Terakhir</h3>
        <Link
          href="/transactions"
          className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Lihat Semua →
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--text-muted)]">Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-1">
          {recent.map((t) => {
            const cat = t.categoryId ? catMap[t.categoryId] : null
            const wallet = walletMap[t.walletId]
            const isIncome = t.type === 'income'
            const isTransfer = t.type === 'transfer'
            const toWallet = t.toWalletId ? walletMap[t.toWalletId] : null

            return (
              <div
                key={t.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                    isIncome
                      ? 'bg-emerald-500/20'
                      : isTransfer
                      ? 'bg-blue-500/20'
                      : 'bg-red-500/20'
                  }`}
                >
                  {isTransfer ? (
                    <ArrowLeftRight size={16} className="text-blue-400" />
                  ) : cat?.icon ? (
                    <span>{cat.icon}</span>
                  ) : isIncome ? (
                    <ArrowDownLeft size={16} className="text-emerald-400" />
                  ) : (
                    <ArrowUpRight size={16} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] break-words">
                    {isTransfer
                      ? `${wallet?.name ?? '-'} → ${toWallet?.name ?? '-'}`
                      : t.source ?? cat?.name ?? 'Transaksi'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] break-words">
                    {formatShortDate(t.date)}{wallet?.name ? ` · ${wallet.name}` : ''}{t.note ? ` · ${t.note}` : ''}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold tabular-nums shrink-0 ${
                    isIncome
                      ? 'text-emerald-400'
                      : isTransfer
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}
                >
                  {isIncome ? '+' : isTransfer ? '' : '-'}
                  {formatCurrency(t.amount)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
