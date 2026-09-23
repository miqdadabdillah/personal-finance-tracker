'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { Budget } from '@/types/finance'
import {
  getBudgetUsed,
  getBudgetStatus,
  getBudgetAvailable,
  getBudgetCarryOver,
  getBudgetActiveRange,
} from '@/lib/calculations'
import { formatCurrency, formatShortDate, formatMonth } from '@/lib/formatters'
import ProgressBar from '../ui/ProgressBar'
import { Pencil, Trash2, TrendingUp } from 'lucide-react'
import Modal from '../ui/Modal'
import BudgetForm from './BudgetForm'

interface BudgetCardProps {
  budget: Budget
}

export default function BudgetCard({ budget }: BudgetCardProps) {
  const { store, deleteBudget } = useFinance()
  const { success } = useToast()
  const [editOpen, setEditOpen] = useState(false)

  const transactions = store?.transactions ?? []
  const categories = store?.categories ?? []
  const category = categories.find((c) => c.id === budget.categoryId)
  const activeRange = getBudgetActiveRange(budget)
  const available = getBudgetAvailable(budget, transactions)
  const used = getBudgetUsed(budget, transactions)
  const carry = getBudgetCarryOver(budget, transactions)
  const remaining = available - used
  const pct = available > 0 ? (used / available) * 100 : 0
  const status = getBudgetStatus(used, available)

  const handleDelete = () => {
    if (confirm('Hapus budget ini?')) {
      deleteBudget(budget.id)
      success('Budget dihapus')
    }
  }

  const periodLabel =
    budget.period === 'custom'
      ? 'Custom'
      : budget.period === 'monthly'
        ? formatMonth(activeRange.from)
        : budget.period === 'yearly'
          ? String(new Date(activeRange.from).getFullYear())
          : `${formatShortDate(activeRange.from)} – ${formatShortDate(activeRange.to)}`

  return (
    <>
      <div className="card group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{category?.icon ?? '💸'}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {category?.name ?? 'Kategori'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{periodLabel}</p>
            </div>
          </div>
          <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditOpen(true)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={handleDelete} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {budget.period !== 'custom' && (
          <p className="flex items-center gap-1 text-[11px] text-violet-400/80 mb-2 flex-wrap">
            <TrendingUp size={11} className="shrink-0" />
            Mengikuti periode berjalan{budget.carryOver === false ? ' · sisa di-reset' : ' · bawa sisa positif'}
          </p>
        )}

        <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)] mb-2">
          <span>{formatCurrency(used)} terpakai</span>
          <span>dari {formatCurrency(available)}</span>
        </div>

        {carry > 0 && (
          <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-400 mb-1.5 flex-wrap">
            <TrendingUp size={11} className="shrink-0" />
            Bawa dari periode sebelumnya: +{formatCurrency(carry)}
          </div>
        )}

        <ProgressBar value={pct} status={status} />

        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-[var(--text-muted)]">Sisa</span>
          <span className={`text-sm font-bold tabular-nums ${remaining < 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 ? ' (Melebihi!)' : ''}
          </span>
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Budget">
        <BudgetForm initial={budget} onSuccess={() => setEditOpen(false)} onCancel={() => setEditOpen(false)} />
      </Modal>
    </>
  )
}
