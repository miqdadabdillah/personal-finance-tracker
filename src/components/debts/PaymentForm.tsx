'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { DebtRecord } from '@/types/finance'
import { getDebtPaid, getDebtRemaining } from '@/lib/calculations'
import { formatCurrency, formatNumberInput, parseNumberInput, toLocalDateString } from '@/lib/formatters'
import { Wallet } from 'lucide-react'

interface PaymentFormProps {
  debt: DebtRecord
  onSuccess: () => void
  onCancel: () => void
}

export default function PaymentForm({ debt, onSuccess, onCancel }: PaymentFormProps) {
  const { store, addDebtPayment } = useFinance()
  const { success, error } = useToast()

  const remaining = getDebtRemaining(debt)
  const paid = getDebtPaid(debt)
  const isLend = debt.type === 'lend'
  const wallets = store?.wallets ?? []

  const [amount, setAmount] = useState(formatNumberInput(remaining))
  const [date, setDate] = useState(toLocalDateString())
  const [walletId, setWalletId] = useState('')
  const [note, setNote] = useState('')

  const pAmount = parseNumberInput(amount)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pAmount || pAmount <= 0) { error('Nominal harus lebih dari 0'); return }
    if (pAmount > remaining) { error(`Maksimal ${formatCurrency(remaining)}`); return }

    addDebtPayment(debt.id, {
      amount: pAmount,
      date: new Date(date).toISOString(),
      walletId: walletId || undefined,
      note: note.trim() || undefined,
    })
    success(isLend ? 'Pembayaran piutang dicatat!' : 'Pembayaran hutang dicatat!')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Summary */}
      <div className="p-4 rounded-2xl bg-[var(--hover)] text-center">
        <p className="text-xs text-[var(--text-muted)] mb-1">
          {isLend ? 'Piutang' : 'Hutang'} ke <strong className="text-[var(--text-primary)]">{debt.name}</strong>
        </p>
        <p className={`text-2xl font-bold tabular-nums ${isLend ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatCurrency(remaining)}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          dari {formatCurrency(debt.amount)} · {formatCurrency(paid)} terbayar
        </p>
      </div>

      {/* Amount */}
      <div>
        <label className="form-label">Nominal {isLend ? 'Diterima' : 'Dibayar'}</label>
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

      {/* Wallet */}
      <div>
        <label className="form-label">Dompet (opsional)</label>
        <select className="form-input" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          <option value="">Tanpa transaksi kas</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
          ))}
        </select>
        {walletId && (
          <p className="flex items-center gap-1.5 text-xs text-violet-400 mt-2">
            <Wallet size={12} />
            {isLend
              ? `Akan tercatat sebagai pemasukan ${wallets.find((w) => w.id === walletId)?.name ?? ''}`
              : `Akan tercatat sebagai pengeluaran ${wallets.find((w) => w.id === walletId)?.name ?? ''}`}
          </p>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="form-label">Catatan (opsional)</label>
        <input
          type="text"
          className="form-input"
          placeholder="Contoh: Cash"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Remaining preview */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
        <span className="text-xs text-[var(--text-muted)]">Sisa setelah ini</span>
        <span className={`text-sm font-bold tabular-nums ${remaining - pAmount <= 0 ? 'text-emerald-400' : 'text-[var(--text-primary)]'}`}>
          {remaining - pAmount <= 0 ? 'LUNAS 🎉' : formatCurrency(Math.max(remaining - pAmount, 0))}
        </span>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
        <button type="submit" className={`flex-1 ${isLend ? 'btn-success' : 'btn-danger'}`}>
          {isLend ? 'Terima Pembayaran' : 'Bayar'}
        </button>
      </div>
    </form>
  )
}