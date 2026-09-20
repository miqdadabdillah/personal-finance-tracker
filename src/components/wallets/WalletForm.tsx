'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { validateAmount } from '@/lib/validators'
import { Wallet } from '@/types/finance'
import { formatNumberInput, parseNumberInput } from '@/lib/formatters'
import { WALLET_COLORS, WALLET_ICONS } from '@/data/default-categories'

interface WalletFormProps {
  initial?: Partial<Wallet>
  onSuccess: () => void
  onCancel: () => void
}

export default function WalletForm({ initial, onSuccess, onCancel }: WalletFormProps) {
  const { addWallet, updateWallet } = useFinance()
  const { success, error } = useToast()

  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '💳')
  const [color, setColor] = useState(initial?.color ?? WALLET_COLORS[0])
  const [initialBalance, setInitialBalance] = useState(
    initial?.initialBalance ? formatNumberInput(initial.initialBalance) : ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { error('Nama dompet wajib diisi'); return }
    const bal = parseNumberInput(initialBalance)

    if (initial?.id) {
      updateWallet(initial.id, { name, icon, color })
      success('Dompet diperbarui!')
    } else {
      addWallet({ name, icon, color, initialBalance: bal })
      success('Dompet dibuat!')
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Preview */}
      <div className="flex justify-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
          style={{ background: color + '33', border: `2px solid ${color}55` }}
        >
          {icon}
        </div>
      </div>

      <div>
        <label className="form-label">Nama Dompet</label>
        <input type="text" className="form-input" placeholder="Contoh: BCA, Cash, E-Wallet" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      {!initial?.id && (
        <div>
          <label className="form-label">Saldo Awal</label>
          <input type="text" inputMode="numeric" className="form-input" placeholder="0" value={initialBalance} onChange={(e) => setInitialBalance(formatNumberInput(e.target.value))} />
        </div>
      )}

      <div>
        <label className="form-label">Icon</label>
        <div className="grid grid-cols-8 gap-2">
          {WALLET_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`text-xl p-2 rounded-xl hover:bg-[var(--hover)] transition-colors ${icon === i ? 'bg-[var(--hover)] ring-2 ring-violet-500' : ''}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Warna</label>
        <div className="flex flex-wrap gap-2">
          {WALLET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--card)] ring-white scale-110' : ''}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
        <button type="submit" className="btn-primary flex-1">Simpan</button>
      </div>
    </form>
  )
}
