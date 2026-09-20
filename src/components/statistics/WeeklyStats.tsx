'use client'

import React from 'react'
import { Transaction, Category } from '@/types/finance'
import { getWeekRange, getDailyData, getTotalIncome, getTotalExpense, getNetCashFlow, getCategoryBreakdown } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import CashFlowChart from '../dashboard/CashFlowChart'
import ExpenseByCategory from '../dashboard/ExpenseByCategory'
import { getDayName } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface WeeklyStatsProps {
  transactions: Transaction[]
  categories: Category[]
}

export default function WeeklyStats({ transactions, categories }: WeeklyStatsProps) {
  const range = getWeekRange()
  const daily = getDailyData(transactions, range)
  const totalIncome = getTotalIncome(transactions, range)
  const totalExpense = getTotalExpense(transactions, range)
  const netCashFlow = getNetCashFlow(transactions, range)
  const categoryBreakdown = getCategoryBreakdown(transactions, range)

  const chartData = daily.map((d) => ({
    label: getDayName(d.date),
    income: d.income,
    expense: d.expense,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pemasukan', value: totalIncome, color: 'text-emerald-400', icon: TrendingUp },
          { label: 'Pengeluaran', value: totalExpense, color: 'text-red-400', icon: TrendingDown },
          { label: 'Cash Flow', value: netCashFlow, color: netCashFlow >= 0 ? 'text-blue-400' : 'text-orange-400', icon: Activity },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <s.icon size={18} className={`${s.color} mx-auto mb-2`} />
            <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
            <p className={`text-base font-bold tabular-nums ${s.color}`}>{(s.value >= 0 && i === 2 ? '+' : i === 2 && s.value < 0 ? '' : i === 1 ? '-' : '+')} {formatCurrency(Math.abs(s.value))}</p>
          </div>
        ))}
      </div>

      <CashFlowChart data={chartData} title="Income vs Pengeluaran (Minggu Ini)" />

      <ExpenseByCategory
        data={categoryBreakdown}
        categories={categories}
        totalExpense={totalExpense}
      />
    </div>
  )
}
