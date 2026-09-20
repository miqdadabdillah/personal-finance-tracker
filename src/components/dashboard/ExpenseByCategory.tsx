'use client'

import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Category } from '@/types/finance'
import { formatCurrency } from '@/lib/formatters'

interface CategoryData {
  categoryId: string
  total: number
}

interface ExpenseByCategoryProps {
  data: CategoryData[]
  categories: Category[]
  totalExpense: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-sm">
        <p className="font-medium text-[var(--text-primary)]">{d.name}</p>
        <p className="text-[var(--text-muted)]">{formatCurrency(d.value)} ({d.pct}%)</p>
      </div>
    )
  }
  return null
}

export default function ExpenseByCategory({ data, categories, totalExpense }: ExpenseByCategoryProps) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const chartData = data.slice(0, 6).map((d) => {
    const cat = catMap[d.categoryId]
    return {
      name: cat?.name ?? 'Lainnya',
      value: d.total,
      color: cat?.color ?? '#6b7280',
      icon: cat?.icon ?? '💸',
      pct: totalExpense > 0 ? Math.round((d.total / totalExpense) * 100) : 0,
    }
  })

  if (chartData.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-sm text-[var(--text-muted)]">Belum ada pengeluaran</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Pengeluaran per Kategori</h3>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2 w-full">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-[var(--text-muted)] flex-1 truncate">{d.icon} {d.name}</span>
              <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
