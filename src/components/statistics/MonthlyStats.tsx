'use client'

import React, { useState } from 'react'
import { Transaction, Category } from '@/types/finance'
import { getMonthRange, getDailyData, getTotalIncome, getTotalExpense, getNetCashFlow, getCategoryBreakdown, filterByDate } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import CashFlowChart from '../dashboard/CashFlowChart'
import ExpenseByCategory from '../dashboard/ExpenseByCategory'
import { TrendingUp, TrendingDown, Activity, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName } from '@/lib/formatters'

interface MonthlyStatsProps {
  transactions: Transaction[]
  categories: Category[]
}

export default function MonthlyStats({ transactions, categories }: MonthlyStatsProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const range = getMonthRange(year, month)
  const daily = getDailyData(transactions, range)
  const totalIncome = getTotalIncome(transactions, range)
  const totalExpense = getTotalExpense(transactions, range)
  const netCashFlow = getNetCashFlow(transactions, range)
  const savings = Math.max(netCashFlow, 0)
  const daysInMonth = daily.length
  const avgDailyExpense = daysInMonth > 0 ? totalExpense / daysInMonth : 0
  const categoryBreakdown = getCategoryBreakdown(transactions, range)

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const chartData = daily.map((d, i) => ({
    label: `${i + 1}`,
    income: d.income,
    expense: d.expense,
  })).filter(d => d.income > 0 || d.expense > 0)

  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex items-center justify-between card py-3">
        <button onClick={goToPrev} className="w-8 h-8 rounded-lg hover:bg-[var(--hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {monthNames[month]} {year}
        </p>
        <button onClick={goToNext} className="w-8 h-8 rounded-lg hover:bg-[var(--hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Pemasukan', value: totalIncome, color: 'text-emerald-400', prefix: '+', icon: TrendingUp },
          { label: 'Pengeluaran', value: totalExpense, color: 'text-red-400', prefix: '-', icon: TrendingDown },
          { label: 'Cash Flow', value: netCashFlow, color: netCashFlow >= 0 ? 'text-blue-400' : 'text-orange-400', prefix: netCashFlow >= 0 ? '+' : '', icon: Activity },
          { label: 'Rata-rata/Hari', value: avgDailyExpense, color: 'text-amber-400', prefix: '', icon: PiggyBank },
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

      {chartData.length > 0 ? (
        <CashFlowChart data={chartData} title={`Income vs Pengeluaran — ${monthNames[month]} ${year}`} />
      ) : (
        <div className="card text-center py-8 text-sm text-[var(--text-muted)]">Belum ada transaksi bulan ini</div>
      )}

      <ExpenseByCategory data={categoryBreakdown} categories={categories} totalExpense={totalExpense} />
    </div>
  )
}
