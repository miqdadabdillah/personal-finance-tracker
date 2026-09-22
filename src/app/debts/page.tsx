'use client'

import React, { useMemo, useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import DebtCard from '@/components/debts/DebtCard'
import DebtForm from '@/components/debts/DebtForm'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { ArrowDownLeft, ArrowUpRight, Scale, HandCoins, Plus, CheckCircle2 } from 'lucide-react'
import { getDebtRemaining, getDebtSummary } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import { DebtType } from '@/types/finance'

type Filter = 'all' | DebtType

export default function DebtsPage() {
  const { store } = useFinance()
  const [createOpen, setCreateOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [hideSettled, setHideSettled] = useState(false)

  const debts = store?.debts ?? []
  const summary = useMemo(() => {
    return getDebtSummary(store?.debts ?? [])
  }, [store?.debts])

  const filtered = debts.filter((d) => {
    if (filter !== 'all' && d.type !== filter) return false
    if (hideSettled && getDebtRemaining(d) <= 0) return false
    return true
  })

  const tabs: { key: Filter; label: string; icon: typeof Scale }[] = [
    { key: 'all', label: 'Semua', icon: Scale },
    { key: 'lend', label: 'Piutang', icon: ArrowDownLeft },
    { key: 'borrow', label: 'Hutang', icon: ArrowUpRight },
  ]

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hutang & Piutang</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{debts.length} catatan tersimpan</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Catat Hutang/Piutang
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ArrowDownLeft size={15} className="text-emerald-400" />
            </div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Total Piutang</p>
          </div>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{formatCurrency(summary.totalLend)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <ArrowUpRight size={15} className="text-red-400" />
            </div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Total Hutang</p>
          </div>
          <p className="text-xl font-bold text-red-400 tabular-nums">{formatCurrency(summary.totalBorrow)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Scale size={15} className="text-violet-400" />
            </div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Net Tagihan</p>
          </div>
          <p className={`text-xl font-bold tabular-nums ${summary.net > 0 ? 'text-emerald-400' : summary.net < 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
            {summary.net > 0 ? '+' : ''}{formatCurrency(summary.net)}
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--hover)] flex items-center justify-center">
              <CheckCircle2 size={15} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Sudah Lunas</p>
          </div>
          <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(summary.settledLend + summary.settledBorrow)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-[var(--hover)] rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === t.key
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <t.icon size={14} className="hidden sm:block" />
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer sm:ml-auto">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-violet-500"
            checked={hideSettled}
            onChange={(e) => setHideSettled(e.target.checked)}
          />
          Sembunyikan yang lunas
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={debts.length === 0 ? 'Belum ada catatan hutang/piutang' : 'Tidak ada catatan'}
          description={
            debts.length === 0
              ? 'Catat uang yang kamu pinjamkan atau pinjam agar tidak lupa tagihannya.'
              : 'Tidak ada catatan yang cocok dengan filter saat ini.'
          }
          action={debts.length === 0 ? { label: '+ Catat Sekarang', onClick: () => setCreateOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Catat Hutang / Piutang">
        <DebtForm onSuccess={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}