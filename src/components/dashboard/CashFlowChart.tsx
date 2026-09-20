'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCompact } from '@/lib/formatters'

interface ChartData {
  label: string
  income: number
  expense: number
}

interface CashFlowChartProps {
  data: ChartData[]
  title?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-sm">
        <p className="font-medium text-[var(--text-primary)] mb-2">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }} className="flex gap-2 items-center">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}: {formatCompact(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function CashFlowChart({ data, title = 'Income vs Pengeluaran' }: CashFlowChartProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={10} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompact(v)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) => (
              <span style={{ color: 'var(--text-muted)' }}>
                {value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </span>
            )}
          />
          <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
