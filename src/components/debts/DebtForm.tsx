'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { DebtRecord, DebtType } from '@/types/finance'
import { formatNumberInput, parseNumberInput, toLocalDateString } from '@/lib/formatters'
import { HandCoins, CreditCard } from 'lucide-react'

interface DebtFormProps {
  initial?: Partial<DebtRecord>
  onSuccess: () => void
  onCancel: () => void
}

export default function DebtForm({ initial, onSuccess, onCancel }: DebtFormProps) {
  const { addDebt, updateDebt } = useFinance()
  const { success, error } = useToast()

  const [type, setType] = useState<DebtType>(initial?.type ?? 'borrow')
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount ? formatNumberInput(initial.amount) : '')
  const [dueDate, setDueDate] = useState(initial?.dueDate?.split('T')[0] ?? '')
  const [note, setNote] = useState(initial?.note ?? '')

  const typeOptions: { key: DebtType; label: string; desc: string; icon: typeof HandCoins }[] = [
    { key: 'borrow', label: 'Hutang', desc: 'Kita berutang', icon: CreditCard },
    { key: 'lend', label: 'Piutang', desc: 'Orang berutang ke kita', icon: HandCoins },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseNumberInput(amount)
    if (!name.trim()) { error('Nama wajib diisi'); return }
    if (!amt || amt <= 0) { error('Nominal harus lebih dari 0'); return }

    const data = {
      type,
      name: name.trim(),
      amount: amt,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      note: note.trim() || undefined,
    }

    if (initial?.id) {
      updateDebt(initial.id, data)
      success('Hutang/piutang diperbarui!')
    } else {
      addDebt(data)
      success('Catatan hutang/piutang dibuat!')
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type */}
      <div>
        <label className="form-label">Tipe</label>
        <div className="grid grid-cols-2 gap-2">
          {typeOptions.map((opt) => {
            const Icon = opt.icon
            const active = type === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setType(opt.key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  active
                    ? opt.key === 'lend'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[10px] opacity-70">{opt.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="form-label">Nama Orang / Instansi</label>
        <input
          type="text"
          className="form-input"
          placeholder={type === 'lend' ? 'Contoh: Budi (pinjamanku)' : 'Contoh: Bank BCA'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Amount */}
      <div>
        <label className="form-label">Nominal Total</label>
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

      {/* Due date */}
      <div>
        <label className="form-label">Jatuh Tempo (opsional)</label>
        <input
          type="date"
          className="form-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={type === 'lend' ? undefined : toLocalDateString()}
        />
      </div>

      {/* Note */}
      <div>
        <label className="form-label">Catatan (opsional)</label>
        <textarea
          className="form-input resize-none"
          rows={2}
          placeholder="Contoh: Pinjam untuk modal usaha, lunas 3 bulan"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
        <button type="submit" className="btn-primary flex-1">Simpan</button>
      </div>
    </form>
  )
}