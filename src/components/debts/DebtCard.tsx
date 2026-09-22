'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { DebtRecord } from '@/types/finance'
import { getDebtPaid, getDebtRemaining, isDebtOverdue } from '@/lib/calculations'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { Pencil, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, CheckCircle2, X } from 'lucide-react'
import Modal from '../ui/Modal'
import DebtForm from './DebtForm'
import PaymentForm from './PaymentForm'

interface DebtCardProps {
  debt: DebtRecord
}

export default function DebtCard({ debt }: DebtCardProps) {
  const { deleteDebt, deleteDebtPayment } = useFinance()
  const { success } = useToast()
  const [payOpen, setPayOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const isLend = debt.type === 'lend'
  const paid = getDebtPaid(debt)
  const remaining = getDebtRemaining(debt)
  const settled = remaining <= 0
  const pct = debt.amount > 0 ? (paid / debt.amount) * 100 : 0
  const overdue = !settled && isDebtOverdue(debt)

  const handleDelete = () => {
    if (confirm(`Hapus catatan ${isLend ? 'piutang' : 'hutang'} "${debt.name}"?`)) {
      deleteDebt(debt.id)
      success('Catatan dihapus')
    }
  }

  const handleDeletePayment = (paymentId: string, amount: number) => {
    if (confirm(`Hapus pembayaran ${formatCurrency(amount)}?`)) {
      deleteDebtPayment(debt.id, paymentId)
      success('Pembayaran dihapus')
    }
  }

  return (
    <>
      <div className={`card group flex flex-col gap-3 ${settled ? 'opacity-80' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                isLend ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {debt.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{debt.name}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                  isLend ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {isLend ? 'Piutang' : 'Hutang'}
                </span>
                {overdue && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-red-500/20 text-red-400 animate-pulse">
                    Terlambat
                  </span>
                )}
                {settled && (
                  <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={10} /> Lunas
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setPayOpen(true)}
              disabled={settled}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                isLend
                  ? 'hover:bg-emerald-500/20 text-[var(--text-muted)] hover:text-emerald-400'
                  : 'hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400'
              }`}
              title={isLend ? 'Terima pembayaran' : 'Bayar'}
            >
              {isLend ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Amounts */}
        <div>
          <p className={`text-2xl font-bold tabular-nums ${isLend ? 'text-emerald-400' : settled ? 'text-[var(--text-muted)]' : 'text-red-400'}`}>
            {formatCurrency(remaining)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {settled ? 'Sudah lunas' : `Sisa`} · {paid > 0 ? `${formatCurrency(paid)} terbayar dari ` : 'Total '}{formatCurrency(debt.amount)}
          </p>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${settled ? 'bg-emerald-500' : isLend ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        {/* Due date */}
        {debt.dueDate && (
          <div className={`flex items-center gap-1.5 text-xs mt-1 ${overdue ? 'text-red-400 font-medium' : 'text-[var(--text-muted)]'}`}>
            <Calendar size={12} className="shrink-0" />
            Jatuh tempo {formatShortDate(debt.dueDate)}
            {settled && ' · Selesai'}
          </div>
        )}

        {/* Note */}
        {debt.note && (
          <p className="text-xs text-[var(--text-muted)] line-clamp-2">{debt.note}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] mt-auto">
          <button
            onClick={() => setShowHistory((v) => !v)}
            disabled={debt.payments.length === 0}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {debt.payments.length === 0 ? 'Belum ada pembayaran' : `${debt.payments.length} pembayaran ${showHistory ? '· tutup' : ''}`}
          </button>
          {!settled ? (
            <button onClick={() => setPayOpen(true)} className={`text-xs font-semibold flex items-center gap-1 ${isLend ? 'text-emerald-400 hover:text-emerald-300' : 'text-red-400 hover:text-red-300'}`}>
              {isLend ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
              {isLend ? 'Terima' : 'Bayar'}
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-400">Selesai</span>
          )}
        </div>

        {/* History */}
        {showHistory && debt.payments.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
            {[...debt.payments].reverse().map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--hover)] text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{formatCurrency(p.amount)}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {formatShortDate(p.date)}{p.walletId ? ' · transfer' : ''}{p.note ? ` · ${p.note}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePayment(p.id, p.amount)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Hapus pembayaran"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={payOpen} onClose={() => setPayOpen(false)} title={isLend ? 'Terima Pembayaran Piutang' : 'Bayar Hutang'}>
        <PaymentForm debt={debt} onSuccess={() => setPayOpen(false)} onCancel={() => setPayOpen(false)} />
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Hutang / Piutang">
        <DebtForm initial={debt} onSuccess={() => setEditOpen(false)} onCancel={() => setEditOpen(false)} />
      </Modal>
    </>
  )
}