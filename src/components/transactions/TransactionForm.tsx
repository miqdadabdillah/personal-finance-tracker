'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { validateAmount, validateWallet } from '@/lib/validators'
import { todayISO } from '@/lib/formatters'
import { getAllocationAmount } from '@/lib/calculations'
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/lib/formatters'
import { Transaction } from '@/types/finance'

interface TransactionFormProps {
  type: 'income' | 'expense'
  initial?: Partial<Transaction>
  onSuccess: () => void
  onCancel: () => void
}

export default function TransactionForm({ type, initial, onSuccess, onCancel }: TransactionFormProps) {
  const { store, addTransaction, addIncomeWithAllocation, updateTransaction } = useFinance()
  const { success, error } = useToast()

  const [amount, setAmount] = useState(initial?.amount ? formatNumberInput(initial.amount) : '')
  const [date, setDate] = useState(
    initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [walletId, setWalletId] = useState(initial?.walletId ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [source, setSource] = useState(initial?.source ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [useAllocation, setUseAllocation] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const wallets = store?.wallets ?? []
  const categories = (store?.categories ?? []).filter((c) => c.type === type)
  const allocationRules = store?.allocationRules ?? []

  const parsedAmount = parseNumberInput(amount)
  const selectedRule = allocationRules.find((r) => r.id === selectedRuleId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amtValidation = validateAmount(parsedAmount)
    if (!amtValidation.valid) { error(amtValidation.error!); return }
    const walletValidation = validateWallet(walletId)
    if (!walletValidation.valid) { error(walletValidation.error!); return }

    if (type === 'income' && useAllocation && selectedRuleId) {
      if (showPreview) {
        addIncomeWithAllocation(
          { type, amount: parsedAmount, walletId, categoryId: categoryId || undefined, source, note, date: new Date(date).toISOString() },
          selectedRuleId
        )
        success('Pemasukan + alokasi berhasil disimpan!')
        onSuccess()
      } else {
        setShowPreview(true)
      }
      return
    }

    if (initial?.id) {
      updateTransaction(initial.id, { amount: parsedAmount, walletId, categoryId: categoryId || undefined, source, note, date: new Date(date).toISOString() })
      success('Transaksi diperbarui!')
    } else {
      addTransaction({ type, amount: parsedAmount, walletId, categoryId: categoryId || undefined, source, note, date: new Date(date).toISOString() })
      success(type === 'income' ? 'Pemasukan ditambahkan!' : 'Pengeluaran ditambahkan!')
    }
    onSuccess()
  }

  if (showPreview && selectedRule) {
    const walletName = wallets.find(w => w.id === walletId)?.name ?? '-'
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-[var(--hover)] text-center">
          <p className="text-xs text-[var(--text-muted)] mb-1">Pemasukan</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(parsedAmount)}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">ke {walletName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Alokasi: {selectedRule.name}</p>
          <div className="space-y-2">
            {selectedRule.allocations.map((alloc, i) => {
              const allocAmt = getAllocationAmount(parsedAmount, alloc.percentage)
              const target = wallets.find(w => w.id === alloc.targetId)
              return (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--hover)]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{alloc.label ?? target?.name ?? alloc.targetId}</p>
                    <p className="text-xs text-[var(--text-muted)]">{alloc.percentage}%</p>
                  </div>
                  <p className="font-semibold text-violet-400 tabular-nums shrink-0">{formatCurrency(allocAmt)}</p>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between p-3 mt-2 rounded-xl border border-violet-500/30 bg-violet-500/10">
            <p className="text-sm font-bold text-[var(--text-primary)]">Total</p>
            <p className="font-bold text-violet-400 tabular-nums">{formatCurrency(parsedAmount)}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setShowPreview(false)} className="btn-ghost flex-1">Kembali</button>
          <button type="button" onClick={handleSubmit} className="btn-primary flex-1">Konfirmasi</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="form-label">Nominal</label>
        <input
          type="text"
          inputMode="numeric"
          className="form-input"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(formatNumberInput(e.target.value))}
          required
        />
      </div>

      {/* Wallet */}
      <div>
        <label className="form-label">Dompet</label>
        <select className="form-input" value={walletId} onChange={(e) => setWalletId(e.target.value)} required>
          <option value="">Pilih dompet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="form-label">Kategori</label>
        <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Pilih kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Source (income only) */}
      {type === 'income' && (
        <div>
          <label className="form-label">Sumber</label>
          <input
            type="text"
            className="form-input"
            placeholder="Contoh: Project Website"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
      )}

      {/* Date */}
      <div>
        <label className="form-label">Tanggal</label>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Note */}
      <div>
        <label className="form-label">Catatan</label>
        <textarea
          className="form-input resize-none"
          rows={2}
          placeholder="Catatan opsional..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Allocation (income only) */}
      {type === 'income' && allocationRules.length > 0 && (
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-violet-500"
              checked={useAllocation}
              onChange={(e) => setUseAllocation(e.target.checked)}
            />
            <span className="text-sm font-medium text-violet-300">Gunakan Alokasi Otomatis</span>
          </label>
          {useAllocation && (
            <select className="form-input" value={selectedRuleId} onChange={(e) => setSelectedRuleId(e.target.value)}>
              <option value="">Pilih aturan alokasi</option>
              {allocationRules.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
        <button type="submit" className="btn-primary flex-1">
          {type === 'income' && useAllocation && selectedRuleId ? 'Preview' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
