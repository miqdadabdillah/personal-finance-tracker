'use client'

import React, { useState } from 'react'
import { Transaction, Category } from '@/types/finance'
import { getYearRange, getMonthlyData, getTotalIncome, getTotalExpense, getNetCashFlow } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCompact, getMonthName } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Activity, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react'

interface YearlyStatsProps {
  transactions: Transaction[]
  categories: Category[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-sm">
        <p className="font-medium text-[var(--text-primary)] mb-2">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name === 'income' ? 'Pemasukan' : 'Pengeluaran'}: {formatCompact(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function YearlyStats({ transactions, categories }: YearlyStatsProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())

  const range = getYearRange(year)
  const monthly = getMonthlyData(transactions, year)
  const totalIncome = getTotalIncome(transactions, range)
  const totalExpense = getTotalExpense(transactions, range)
  const netCashFlow = getNetCashFlow(transactions, range)
  const savings = Math.max(netCashFlow, 0)

  const chartData = monthly.map((m) => ({
    label: getMonthName(m.month),
    income: m.income,
    expense: m.expense,
  }))

  return (
    <div className="space-y-4">
      {/* Year Selector */}
      <div className="flex items-center justify-between card py-3">
        <button onClick={() => setYear(y => y - 1)} className="w-8 h-8 rounded-lg hover:bg-[var(--hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{year}</p>
        <button onClick={() => setYear(y => y + 1)} className="w-8 h-8 rounded-lg hover:bg-[var(--hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Pemasukan', value: totalIncome, color: 'text-emerald-400', prefix: '+', icon: TrendingUp },
          { label: 'Total Pengeluaran', value: totalExpense, color: 'text-red-400', prefix: '-', icon: TrendingDown },
          { label: 'Cash Flow', value: netCashFlow, color: netCashFlow >= 0 ? 'text-blue-400' : 'text-orange-400', prefix: netCashFlow >= 0 ? '+' : '', icon: Activity },
          { label: 'Total Tabungan', value: savings, color: 'text-violet-400', prefix: '', icon: PiggyBank },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={15} className={s.color} />
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
            <p className={`text-lg font-bold tabular-nums ${s.color}`}>
              {s.prefix}{formatCurrency(Math.abs(s.value))}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Cash Flow Bulanan {year}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={8} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} width={56} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span style={{ color: 'var(--text-muted)' }}>{v === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>} />
            <Bar dataKey="income" name="income" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
