'use client'

import React, { useState } from 'react'
import { Transaction, Category } from '@/types/finance'
import { getDailyData, getTotalIncome, getTotalExpense, getNetCashFlow, getCategoryBreakdown } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import CashFlowChart from '../dashboard/CashFlowChart'
import ExpenseByCategory from '../dashboard/ExpenseByCategory'
import { getDayName } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Activity, PiggyBank, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw } from 'lucide-react'
import DeltaBadge from './DeltaBadge'

interface WeeklyStatsProps {
  transactions: Transaction[]
  categories: Category[]
}

export default function WeeklyStats({ transactions, categories }: WeeklyStatsProps) {
  const [weekStart, setWeekStart] = useState<Date>(getCurrentWeekStart)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const range = { from: weekStart.toISOString(), to: weekEnd.toISOString() }
  const daily = getDailyData(transactions, range)
  const totalIncome = getTotalIncome(transactions, range)
  const totalExpense = getTotalExpense(transactions, range)
  const netCashFlow = getNetCashFlow(transactions, range)
  const categoryBreakdown = getCategoryBreakdown(transactions, range)

  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(weekStart.getDate() - 7)
  const prevWeekEnd = new Date(prevWeekStart)
  prevWeekEnd.setDate(prevWeekStart.getDate() + 6)
  const prevRange = { from: prevWeekStart.toISOString(), to: prevWeekEnd.toISOString() }
  const prevIncome = getTotalIncome(transactions, prevRange)
  const prevExpense = getTotalExpense(transactions, prevRange)
  const prevNetCashFlow = getNetCashFlow(transactions, prevRange)

  const avgDailyExpense = daily.length > 0 ? totalExpense / daily.length : 0
  const prevAvgDailyExpense = prevExpense / 7

  const chartData = daily.map((d) => ({
    label: getDayName(d.date),
    income: d.income,
    expense: d.expense,
  }))

  const isCurrentWeek = getCurrentWeekStart().getTime() === weekStart.getTime()
  const resetToCurrentWeek = () => setWeekStart(getCurrentWeekStart())

  const shiftWeek = (offset: number) => {
    const shifted = new Date(weekStart)
    shifted.setDate(weekStart.getDate() + offset * 7)
    setWeekStart(shifted)
  }

  const goToMonth = (offset: number) => {
    const target = new Date(weekStart.getFullYear(), weekStart.getMonth() + offset, 15)
    setWeekStart(getWeekStartContaining(target))
  }

  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

  const monthLabel = () => `${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  const weekLabel = () => {
    const startDay = weekStart.getDate()
    const endDay = weekEnd.getDate()
    if (weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear()) {
      return `${startDay} - ${endDay} ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    }
    if (weekStart.getFullYear() === weekEnd.getFullYear()) {
      return `${startDay} ${monthNames[weekStart.getMonth()]} - ${endDay} ${monthNames[weekEnd.getMonth()]} ${weekStart.getFullYear()}`
    }
    return `${startDay} ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()} - ${endDay} ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-2 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => goToMonth(-1)} className="w-8 h-8 rounded-lg hover:bg-[var(--hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
            <ChevronsLeft size={18} />
          </button>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{monthLabel()}</p>
          <button onClick={() => goToMonth(1)} className="w-8 h-8 rounded-lg hover:bg-[var(--hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
            <ChevronsRight size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
          <button onClick={() => shiftWeek(-1)} className="w-8 h-8 rounded-lg hover:bg-[var(--hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
            <ChevronLeft size={18} />
          </button>
          <p className="text-xs text-[var(--text-muted)]">{weekLabel()}</p>
          <button onClick={() => shiftWeek(1)} className="w-8 h-8 rounded-lg hover:bg-[var(--hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        {!isCurrentWeek && (
          <button onClick={resetToCurrentWeek} className="w-full flex items-center justify-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300 border-t border-[var(--border)] pt-2 transition-colors">
            <RotateCcw size={12} />
            Kembali ke minggu ini
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Pemasukan', value: totalIncome, previous: prevIncome, color: 'text-emerald-400', prefix: '+', icon: TrendingUp, positive: true },
          { label: 'Pengeluaran', value: totalExpense, previous: prevExpense, color: 'text-red-400', prefix: '-', icon: TrendingDown, positive: false },
          { label: 'Cash Flow', value: netCashFlow, previous: prevNetCashFlow, color: netCashFlow >= 0 ? 'text-blue-400' : 'text-orange-400', prefix: netCashFlow >= 0 ? '+' : '', icon: Activity, positive: true },
          { label: 'Rata-rata/Hari', value: avgDailyExpense, previous: prevAvgDailyExpense, color: 'text-amber-400', prefix: '', icon: PiggyBank, positive: false },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={15} className={s.color} />
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
            <p className={`text-lg font-bold tabular-nums ${s.color}`}>
              {s.prefix}{formatCurrency(Math.abs(s.value))}
            </p>
            <DeltaBadge value={s.value} previous={s.previous} positive={s.positive} label="vs minggu lalu" />
          </div>
        ))}
      </div>

      {totalIncome === 0 && totalExpense === 0 ? (
        <div className="card text-center py-8 text-sm text-[var(--text-muted)]">Belum ada transaksi di periode ini</div>
      ) : (
        <CashFlowChart data={chartData} title={`Income vs Pengeluaran (${weekLabel()})`} />
      )}

      <ExpenseByCategory
        data={categoryBreakdown}
        categories={categories}
        totalExpense={totalExpense}
      />
    </div>
  )
}

function getCurrentWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const from = new Date(now)
  from.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  from.setHours(0, 0, 0, 0)
  return from
}

function getWeekStartContaining(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}