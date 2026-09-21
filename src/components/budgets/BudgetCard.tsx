'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { Budget } from '@/types/finance'
import { getBudgetUsed, getBudgetStatus } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import ProgressBar from '../ui/ProgressBar'
import { Pencil, Trash2 } from 'lucide-react'
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
  const used = getBudgetUsed(budget, transactions)
  const remaining = budget.amount - used
  const pct = budget.amount > 0 ? (used / budget.amount) * 100 : 0
  const status = getBudgetStatus(used, budget.amount)

  const handleDelete = () => {
    if (confirm('Hapus budget ini?')) {
      deleteBudget(budget.id)
      success('Budget dihapus')
    }
  }

  const periodLabel: Record<string, string> = {
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
    custom: 'Custom',
  }

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
              <p className="text-xs text-[var(--text-muted)]">{periodLabel[budget.period]}</p>
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

        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-2">
          <span>{formatCurrency(used)} terpakai</span>
          <span>dari {formatCurrency(budget.amount)}</span>
        </div>

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
