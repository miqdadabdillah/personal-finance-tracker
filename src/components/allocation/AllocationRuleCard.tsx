'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { AllocationRule } from '@/types/finance'
import { getAllocationAmount } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../ui/Modal'
import AllocationRuleForm from './AllocationRuleForm'

interface AllocationRuleCardProps {
  rule: AllocationRule
}

export default function AllocationRuleCard({ rule }: AllocationRuleCardProps) {
  const { store, deleteAllocationRule } = useFinance()
  const { success } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const wallets = store?.wallets ?? []
  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w]))

  const handleDelete = () => {
    if (confirm(`Hapus aturan alokasi "${rule.name}"?`)) {
      deleteAllocationRule(rule.id)
      success('Aturan alokasi dihapus')
    }
  }

  const total = rule.allocations.reduce((s, a) => s + a.percentage, 0)

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{rule.name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {rule.allocations.length} alokasi · Total {total}%
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEditOpen(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--hover)] text-[var(--text-muted)] transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
            {rule.allocations.map((alloc, i) => {
              const wallet = walletMap[alloc.targetId]
              return (
                <div key={i} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                      style={{ background: (wallet?.color ?? '#6366f1') + '33' }}
                    >
                      {wallet?.icon ?? '💰'}
                    </div>
                    <span className="text-[var(--text-primary)] truncate">
                      {alloc.label ?? wallet?.name ?? alloc.targetId}
                    </span>
                  </div>
                  <span className="font-medium text-violet-400 tabular-nums shrink-0">
                    {alloc.percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Aturan Alokasi" maxWidth="max-w-lg">
        <AllocationRuleForm
          initial={rule}
          onSuccess={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </>
  )
}
