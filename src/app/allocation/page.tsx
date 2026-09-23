'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import AllocationRuleCard from '@/components/allocation/AllocationRuleCard'
import AllocationRuleForm from '@/components/allocation/AllocationRuleForm'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { Layers, Plus } from 'lucide-react'

export default function AllocationPage() {
  const { store } = useFinance()
  const [createOpen, setCreateOpen] = useState(false)

  const rules = store?.allocationRules ?? []

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Alokasi Income</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Bagi pemasukan otomatis berdasarkan persentase</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus size={16} /> Buat Rule
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
        <p className="text-sm text-violet-300 leading-relaxed">
          💡 <strong>Cara Kerja:</strong> Saat menambahkan pemasukan, pilih rule alokasi.
          Sistem akan otomatis membagi nominal ke dompet-dompet yang telah ditentukan sesuai persentase.
        </p>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Belum ada aturan alokasi"
          description="Buat aturan alokasi untuk membagi pemasukan secara otomatis, misalnya 50% kebutuhan, 20% tabungan, 30% investasi."
          action={{ label: '+ Buat Rule', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <AllocationRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Buat Aturan Alokasi" maxWidth="max-w-lg">
        <AllocationRuleForm onSuccess={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
