'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { Budget, BudgetPeriod } from '@/types/finance'
import { getMonthRange } from '@/lib/calculations'
import { formatNumberInput, parseNumberInput } from '@/lib/formatters'

interface BudgetFormProps {
  initial?: Partial<Budget>
  onSuccess: () => void
  onCancel: () => void
}

export default function BudgetForm({ initial, onSuccess, onCancel }: BudgetFormProps) {
  const { store, addBudget, updateBudget } = useFinance()
  const { success, error } = useToast()

  const now = new Date()
  const monthRange = getMonthRange()
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [amount, setAmount] = useState(initial?.amount ? formatNumberInput(initial.amount) : '')
  const [period, setPeriod] = useState<BudgetPeriod>(initial?.period ?? 'monthly')
  const [startDate, setStartDate] = useState(
    initial?.startDate?.split('T')[0] ?? monthRange.from.split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    initial?.endDate?.split('T')[0] ?? monthRange.to.split('T')[0]
  )

  const categories = (store?.categories ?? []).filter((c) => c.type === 'expense')

  const handlePeriodChange = (p: BudgetPeriod) => {
    setPeriod(p)
    const now = new Date()
    if (p === 'monthly') {
      const range = getMonthRange()
      setStartDate(range.from.split('T')[0])
      setEndDate(range.to.split('T')[0])
    } else if (p === 'weekly') {
      const day = now.getDay()
      const from = new Date(now)
      from.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      const to = new Date(from)
      to.setDate(from.getDate() + 6)
      setStartDate(from.toISOString().split('T')[0])
      setEndDate(to.toISOString().split('T')[0])
    } else if (p === 'yearly') {
      setStartDate(`${now.getFullYear()}-01-01`)
      setEndDate(`${now.getFullYear()}-12-31`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseNumberInput(amount)
    if (!amt || amt <= 0) { error('Nominal harus lebih dari 0'); return }
    if (!categoryId) { error('Pilih kategori'); return }

    const data = {
      categoryId,
      amount: amt,
      period,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    }

    if (initial?.id) {
      updateBudget(initial.id, data)
      success('Budget diperbarui!')
    } else {
      addBudget(data)
      success('Budget dibuat!')
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Kategori</label>
        <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">Pilih kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Nominal Budget</label>
        <input type="text" inputMode="numeric" className="form-input" placeholder="0" value={amount} onChange={(e) => setAmount(formatNumberInput(e.target.value))} required />
      </div>

      <div>
        <label className="form-label">Periode</label>
        <div className="grid grid-cols-4 gap-2">
          {(['weekly', 'monthly', 'yearly', 'custom'] as BudgetPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePeriodChange(p)}
              className={`py-2 rounded-xl text-xs font-medium transition-all ${
                period === p
                  ? 'bg-violet-500 text-white'
                  : 'bg-[var(--hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p === 'weekly' ? 'Minggu' : p === 'monthly' ? 'Bulan' : p === 'yearly' ? 'Tahun' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Tanggal Mulai</label>
          <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Tanggal Selesai</label>
          <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
        <button type="submit" className="btn-primary flex-1">Simpan</button>
      </div>
    </form>
  )
}
