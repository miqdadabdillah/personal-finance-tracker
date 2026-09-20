'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { AllocationRule, AllocationTarget } from '@/types/finance'
import { validateAllocationTotal } from '@/lib/validators'
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/lib/formatters'
import { Plus, Trash2 } from 'lucide-react'

interface AllocationRuleFormProps {
  initial?: Partial<AllocationRule>
  onSuccess: () => void
  onCancel: () => void
}

export default function AllocationRuleForm({ initial, onSuccess, onCancel }: AllocationRuleFormProps) {
  const { store, addAllocationRule, updateAllocationRule } = useFinance()
  const { success, error } = useToast()

  const [name, setName] = useState(initial?.name ?? '')
  const [allocations, setAllocations] = useState<AllocationTarget[]>(
    initial?.allocations ?? [
      { targetId: '', targetType: 'wallet', percentage: 50, label: '' },
      { targetId: '', targetType: 'wallet', percentage: 50, label: '' },
    ]
  )
  const [previewAmount, setPreviewAmount] = useState('')

  const wallets = store?.wallets ?? []
  const total = allocations.reduce((s, a) => s + (Number(a.percentage) || 0), 0)

  const updateAlloc = (i: number, field: keyof AllocationTarget, value: string | number) => {
    setAllocations((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)))
  }

  const addRow = () => {
    setAllocations((prev) => [...prev, { targetId: '', targetType: 'wallet', percentage: 0, label: '' }])
  }

  const removeRow = (i: number) => {
    setAllocations((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { error('Nama rule wajib diisi'); return }
    const validation = validateAllocationTotal(allocations)
    if (!validation.valid) { error(validation.error!); return }
    if (allocations.some((a) => !a.label && !a.targetId)) {
      error('Semua alokasi harus memiliki nama atau target dompet'); return
    }

    const data = { name, allocations }
    if (initial?.id) {
      updateAllocationRule(initial.id, data)
      success('Aturan alokasi diperbarui!')
    } else {
      addAllocationRule(data)
      success('Aturan alokasi disimpan!')
    }
    onSuccess()
  }

  const amt = parseNumberInput(previewAmount)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Nama Rule</label>
        <input type="text" className="form-input" placeholder="Contoh: Gaji Bulanan" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">Alokasi</label>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            Math.round(total) === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {total.toFixed(1)}%
          </span>
        </div>

        <div className="space-y-2">
          {allocations.map((alloc, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                className="form-input flex-1 text-sm"
                placeholder="Nama (Kebutuhan, Tabungan...)"
                value={alloc.label ?? ''}
                onChange={(e) => updateAlloc(i, 'label', e.target.value)}
              />
              <select
                className="form-input w-32 text-sm"
                value={alloc.targetId}
                onChange={(e) => updateAlloc(i, 'targetId', e.target.value)}
              >
                <option value="">Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                ))}
              </select>
              <div className="relative w-20">
                <input
                  type="number"
                  className="form-input text-sm pr-5 no-spinner"
                  value={alloc.percentage}
                  onChange={(e) => updateAlloc(i, 'percentage', Number(e.target.value))}
                  min="0"
                  max="100"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">%</span>
              </div>
              {allocations.length > 2 && (
                <button type="button" onClick={() => removeRow(i)} className="shrink-0 w-7 h-7 rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 flex items-center justify-center transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addRow} className="mt-2 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
          <Plus size={14} /> Tambah baris
        </button>

        {Math.round(total) !== 100 && (
          <p className="text-xs text-red-400 mt-2">Total harus 100% (saat ini {total.toFixed(1)}%)</p>
        )}
      </div>

      {/* Preview Calculator */}
      <div className="p-3 rounded-xl bg-[var(--hover)] space-y-2">
        <label className="form-label mb-1">Preview Kalkulasi</label>
        <input
          type="text"
          inputMode="numeric"
          className="form-input text-sm"
          placeholder="Masukkan nominal untuk preview..."
          value={previewAmount}
          onChange={(e) => setPreviewAmount(formatNumberInput(e.target.value))}
        />
        {amt > 0 && (
          <div className="space-y-1.5 pt-1">
            {allocations.map((alloc, i) => {
              const calcAmt = Math.round((amt * (Number(alloc.percentage) || 0)) / 100)
              return (
                <div key={i} className="flex justify-between gap-3 text-xs">
                  <span className="text-[var(--text-muted)] truncate">{alloc.label || `Alokasi ${i + 1}`} ({alloc.percentage}%)</span>
                  <span className="font-medium text-[var(--text-primary)] tabular-nums shrink-0">{formatCurrency(calcAmt)}</span>
                </div>
              )
            })}
            <div className="flex justify-between text-xs font-bold border-t border-[var(--border)] pt-1 mt-1">
              <span className="text-[var(--text-muted)]">Total</span>
              <span className="text-violet-400 tabular-nums">{formatCurrency(amt)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
        <button type="submit" className="btn-primary flex-1">Simpan</button>
      </div>
    </form>
  )
}
