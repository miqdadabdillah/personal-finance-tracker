'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { validateAmount } from '@/lib/validators'
import { formatNumberInput, parseNumberInput } from '@/lib/formatters'
import { ArrowDown } from 'lucide-react'

interface TransferFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function TransferForm({ onSuccess, onCancel }: TransferFormProps) {
  const { store, addTransaction } = useFinance()
  const { success, error } = useToast()

  const [amount, setAmount] = useState('')
  const [fromWalletId, setFromWalletId] = useState('')
  const [toWalletId, setToWalletId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const wallets = store?.wallets ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseNumberInput(amount)
    const validation = validateAmount(amt)
    if (!validation.valid) { error(validation.error!); return }
    if (!fromWalletId) { error('Pilih dompet asal'); return }
    if (!toWalletId) { error('Pilih dompet tujuan'); return }
    if (fromWalletId === toWalletId) { error('Dompet asal dan tujuan harus berbeda'); return }

    addTransaction({
      type: 'transfer',
      amount: amt,
      walletId: fromWalletId,
      toWalletId,
      note,
      date: new Date(date).toISOString(),
    })
    success('Transfer berhasil!')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div>
        <label className="form-label">Dari Dompet</label>
        <select className="form-input" value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)} required>
          <option value="">Pilih dompet asal</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-center">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
          <ArrowDown size={16} className="text-blue-400" />
        </div>
      </div>

      <div>
        <label className="form-label">Ke Dompet</label>
        <select className="form-input" value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} required>
          <option value="">Pilih dompet tujuan</option>
          {wallets.filter((w) => w.id !== fromWalletId).map((w) => (
            <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Tanggal</label>
        <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div>
        <label className="form-label">Catatan</label>
        <input type="text" className="form-input" placeholder="Opsional..." value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
        <button type="submit" className="btn-primary flex-1">Transfer</button>
      </div>
    </form>
  )
}
