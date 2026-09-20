'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import WeeklyStats from '@/components/statistics/WeeklyStats'
import MonthlyStats from '@/components/statistics/MonthlyStats'
import YearlyStats from '@/components/statistics/YearlyStats'

type Tab = 'weekly' | 'monthly' | 'yearly'

export default function StatisticsPage() {
  const { store } = useFinance()
  const [tab, setTab] = useState<Tab>('monthly')

  const transactions = store?.transactions ?? []
  const categories = store?.categories ?? []

  const tabs: { key: Tab; label: string }[] = [
    { key: 'weekly', label: 'Mingguan' },
    { key: 'monthly', label: 'Bulanan' },
    { key: 'yearly', label: 'Tahunan' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Statistik</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Analisis kondisi keuanganmu</p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-[var(--hover)] rounded-xl p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-violet-500 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'weekly' && <WeeklyStats transactions={transactions} categories={categories} />}
      {tab === 'monthly' && <MonthlyStats transactions={transactions} categories={categories} />}
      {tab === 'yearly' && <YearlyStats transactions={transactions} categories={categories} />}
    </div>
  )
}
