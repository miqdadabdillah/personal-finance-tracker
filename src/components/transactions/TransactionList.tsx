'use client'

import React, { useState, useMemo } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Transaction, Category, Wallet } from '@/types/finance'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Pencil, Trash2, Search, Filter } from 'lucide-react'
import Modal from '../ui/Modal'
import TransactionForm from './TransactionForm'
import EmptyState from '../ui/EmptyState'

interface TransactionListProps {
  transactions?: Transaction[]
  showFilter?: boolean
}

export default function TransactionList({ transactions: externalTxns, showFilter = true }: TransactionListProps) {
  const { store, deleteTransaction } = useFinance()
  const { success } = useToast()
  const [editTxn, setEditTxn] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterWallet, setFilterWallet] = useState<string>('all')

  const allTxns = externalTxns ?? store?.transactions ?? []
  const categories = store?.categories ?? []
  const wallets = store?.wallets ?? []
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w]))

  const filtered = useMemo(() => {
    return allTxns.filter((t) => {
      const cat = t.categoryId ? catMap[t.categoryId] : null
      const wallet = walletMap[t.walletId]
      const matchSearch =
        !search ||
        (t.source ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (t.note ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (cat?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (wallet?.name ?? '').toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'all' || t.type === filterType
      const matchWallet = filterWallet === 'all' || t.walletId === filterWallet
      return matchSearch && matchType && matchWallet
    })
  }, [allTxns, search, filterType, filterWallet, catMap, walletMap])

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {}
    for (const t of [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )) {
      const day = t.date.split('T')[0]
      if (!map[day]) map[day] = []
      map[day].push(t)
    }
    return Object.entries(map)
  }, [filtered])

  const handleDelete = (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      deleteTransaction(id)
      success('Transaksi dihapus')
    }
  }

  return (
    <div className="space-y-4">
      {showFilter && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              className="form-input pl-9"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-input sm:w-36" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="transfer">Transfer</option>
          </select>
          <select className="form-input sm:w-36" value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)}>
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      )}

      {grouped.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Mulai catat keuanganmu dengan menambahkan pemasukan atau pengeluaran pertama."
        />
      ) : (
        grouped.map(([day, txns]) => (
          <div key={day}>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
              {formatDate(day + 'T00:00:00', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="card divide-y divide-[var(--border)] p-0 overflow-hidden">
              {txns.map((t) => {
                const cat = t.categoryId ? catMap[t.categoryId] : null
                const wallet = walletMap[t.walletId]
                const toWallet = t.toWalletId ? walletMap[t.toWalletId] : null
                const isIncome = t.type === 'income'
                const isTransfer = t.type === 'transfer'
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover)] transition-colors group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                      isIncome ? 'bg-emerald-500/20' : isTransfer ? 'bg-blue-500/20' : 'bg-red-500/20'
                    }`}>
                      {isTransfer ? (
                        <ArrowLeftRight size={15} className="text-blue-400" />
                      ) : cat?.icon ? (
                        <span>{cat.icon}</span>
                      ) : isIncome ? (
                        <ArrowDownLeft size={15} className="text-emerald-400" />
                      ) : (
                        <ArrowUpRight size={15} className="text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {isTransfer
                          ? `${wallet?.name ?? '-'} → ${toWallet?.name ?? '-'}`
                          : t.source ?? cat?.name ?? 'Transaksi'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {wallet?.name ?? '-'}{t.note ? ` · ${t.note}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold tabular-nums shrink-0 ${
                        isIncome ? 'text-emerald-400' : isTransfer ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(t.amount)}
                      </p>
                      {t.type !== 'transfer' && (
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditTxn(t)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Edit Modal */}
      {editTxn && (
        <Modal
          isOpen={true}
          onClose={() => setEditTxn(null)}
          title={editTxn.type === 'income' ? 'Edit Pemasukan' : 'Edit Pengeluaran'}
        >
          <TransactionForm
            type={editTxn.type as 'income' | 'expense'}
            initial={editTxn}
            onSuccess={() => setEditTxn(null)}
            onCancel={() => setEditTxn(null)}
          />
        </Modal>
      )}
    </div>
  )
}
