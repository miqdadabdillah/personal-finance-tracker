'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import WalletCard from '@/components/wallets/WalletCard'
import WalletForm from '@/components/wallets/WalletForm'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { Wallet, Plus } from 'lucide-react'
import { getTotalBalance } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'

export default function WalletsPage() {
  const { store } = useFinance()
  const [createOpen, setCreateOpen] = useState(false)

  const wallets = store?.wallets ?? []
  const transactions = store?.transactions ?? []
  const totalBalance = getTotalBalance(wallets, transactions)

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dompet</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Total saldo: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Dompet Baru
        </button>
      </div>

      {wallets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada dompet"
          description="Buat dompet pertamamu untuk mulai mencatat saldo dan transaksi."
          action={{ label: '+ Buat Dompet', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wallets.map((wallet, idx) => (
            <WalletCard key={wallet.id} wallet={wallet} transactions={transactions} index={idx} count={wallets.length} />
          ))}
          <button
            onClick={() => setCreateOpen(true)}
            className="card border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-violet-500/50 transition-all cursor-pointer min-h-[140px]"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Tambah Dompet</span>
          </button>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Buat Dompet Baru">
        <WalletForm onSuccess={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
