'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import BudgetCard from '@/components/budgets/BudgetCard'
import BudgetForm from '@/components/budgets/BudgetForm'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { Target, Plus } from 'lucide-react'
import { getBudgetUsagePercent } from '@/lib/calculations'

export default function BudgetsPage() {
  const { store } = useFinance()
  const [createOpen, setCreateOpen] = useState(false)

  const budgets = store?.budgets ?? []
  const transactions = store?.transactions ?? []
  const overallUsage = getBudgetUsagePercent(budgets, transactions)

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Budget</h1>
          {budgets.length > 0 && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Penggunaan keseluruhan:{' '}
              <span className={`font-semibold ${overallUsage > 90 ? 'text-red-400' : overallUsage > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {overallUsage}%
              </span>
            </p>
          )}
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus size={16} /> Budget Baru
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Belum ada budget"
          description="Buat budget untuk setiap kategori pengeluaran agar kamu bisa memantau penggunaannya."
          action={{ label: '+ Buat Budget', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Buat Budget Baru">
        <BudgetForm onSuccess={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
