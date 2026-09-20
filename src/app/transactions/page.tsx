'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import TransactionList from '@/components/transactions/TransactionList'
import TransactionForm from '@/components/transactions/TransactionForm'
import TransferForm from '@/components/transactions/TransferForm'
import Modal from '@/components/ui/Modal'
import QuickAdd from '@/components/dashboard/QuickAdd'
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'

export default function TransactionsPage() {
  const { store } = useFinance()
  const [modal, setModal] = useState<'income' | 'expense' | 'transfer' | null>(null)

  const txnCount = store?.transactions.length ?? 0

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transaksi</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{txnCount} transaksi tersimpan</p>
        </div>
        <div className="hidden md:flex gap-2">
          <button onClick={() => setModal('income')} className="btn-success flex items-center gap-2 text-sm">
            <TrendingUp size={15} /> Pemasukan
          </button>
          <button onClick={() => setModal('expense')} className="btn-danger flex items-center gap-2 text-sm">
            <TrendingDown size={15} /> Pengeluaran
          </button>
          <button onClick={() => setModal('transfer')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeftRight size={15} /> Transfer
          </button>
        </div>
      </div>

      <TransactionList showFilter={true} />

      <Modal isOpen={modal === 'income'} onClose={() => setModal(null)} title="Tambah Pemasukan">
        <TransactionForm type="income" onSuccess={() => setModal(null)} onCancel={() => setModal(null)} />
      </Modal>
      <Modal isOpen={modal === 'expense'} onClose={() => setModal(null)} title="Tambah Pengeluaran">
        <TransactionForm type="expense" onSuccess={() => setModal(null)} onCancel={() => setModal(null)} />
      </Modal>
      <Modal isOpen={modal === 'transfer'} onClose={() => setModal(null)} title="Transfer">
        <TransferForm onSuccess={() => setModal(null)} onCancel={() => setModal(null)} />
      </Modal>

      <QuickAdd />
    </div>
  )
}
