'use client'

import React, { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, X } from 'lucide-react'
import TransactionForm from '../transactions/TransactionForm'
import TransferForm from '../transactions/TransferForm'
import Modal from '../ui/Modal'

type QuickAddType = 'income' | 'expense' | 'transfer' | null

export default function QuickAdd() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<QuickAddType>(null)

  const handleClose = () => {
    setOpen(false)
    setMode(null)
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        id="quick-add-btn"
        className="fixed bottom-20 right-5 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Picker Modal */}
      <Modal isOpen={open && !mode} onClose={handleClose} title="Tambah Transaksi">
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setMode('income')}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-emerald-400">+ Pemasukan</p>
              <p className="text-xs text-[var(--text-muted)]">Catat uang masuk</p>
            </div>
          </button>
          <button
            onClick={() => setMode('expense')}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/60 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-red-400">- Pengeluaran</p>
              <p className="text-xs text-[var(--text-muted)]">Catat uang keluar</p>
            </div>
          </button>
          <button
            onClick={() => setMode('transfer')}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/60 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-blue-400">⇄ Transfer</p>
              <p className="text-xs text-[var(--text-muted)]">Pindah antar dompet</p>
            </div>
          </button>
        </div>
      </Modal>

      {/* Income/Expense Form */}
      {(mode === 'income' || mode === 'expense') && (
        <Modal
          isOpen={true}
          onClose={handleClose}
          title={mode === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
          maxWidth="max-w-lg"
        >
          <TransactionForm
            type={mode}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        </Modal>
      )}

      {/* Transfer Form */}
      {mode === 'transfer' && (
        <Modal isOpen={true} onClose={handleClose} title="Transfer Antar Dompet" maxWidth="max-w-md">
          <TransferForm onSuccess={handleClose} onCancel={handleClose} />
        </Modal>
      )}
    </>
  )
}
