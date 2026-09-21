'use client'

import React, { useState } from 'react'
import { Wallet, Transaction } from '@/types/finance'
import { formatCurrency } from '@/lib/formatters'
import { getWalletBalance } from '@/lib/calculations'
import { Pencil, Trash2, ArrowLeftRight, ChevronUp, ChevronDown } from 'lucide-react'
import Modal from '../ui/Modal'
import WalletForm from './WalletForm'
import TransferForm from '../transactions/TransferForm'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'

interface WalletCardProps {
  wallet: Wallet
  transactions: Transaction[]
  index: number
  count: number
}

export default function WalletCard({ wallet, transactions, index, count }: WalletCardProps) {
  const { deleteWallet, moveWallet } = useFinance()
  const { success } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const balance = getWalletBalance(wallet, transactions)

  const handleDelete = () => {
    if (confirm(`Hapus dompet "${wallet.name}"? Semua transaksi terkait juga akan dihapus.`)) {
      deleteWallet(wallet.id)
      success('Dompet dihapus')
    }
  }

  return (
    <>
      <div
        className="card group relative overflow-hidden"
        style={{ borderTop: `3px solid ${wallet.color ?? '#6366f1'}` }}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: (wallet.color ?? '#6366f1') + '22' }}
          >
            {wallet.icon ?? '💳'}
          </div>
          <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setTransferOpen(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-500/20 text-[var(--text-muted)] hover:text-blue-400 transition-colors"
              title="Transfer"
            >
              <ArrowLeftRight size={14} />
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
        <p className="text-sm text-[var(--text-muted)] font-medium mb-1">{wallet.name}</p>
        <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
          {formatCurrency(balance)}
        </p>
        {balance < 0 && (
          <p className="text-xs text-red-400 mt-1">Saldo negatif</p>
        )}

        <div className="flex items-center justify-end mt-4">
          <div className="flex gap-1.5">
            <button
              onClick={() => moveWallet(wallet.id, -1)}
              disabled={index === 0}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--text-muted)]"
              title="Naikkan posisi"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => moveWallet(wallet.id, 1)}
              disabled={index === count - 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--text-muted)]"
              title="Turunkan posisi"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Dompet">
        <WalletForm
          initial={wallet}
          onSuccess={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <Modal isOpen={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer">
        <TransferForm onSuccess={() => setTransferOpen(false)} onCancel={() => setTransferOpen(false)} />
      </Modal>
    </>
  )
}
