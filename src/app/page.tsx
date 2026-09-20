'use client'

import React, { useState, useMemo } from 'react'
import { useFinance } from '@/context/FinanceContext'
import {
  getTotalBalance,
  getTotalIncome,
  getTotalExpense,
  getNetCashFlow,
  getBudgetUsagePercent,
  getMonthRange,
  getWeekRange,
  getYearRange,
  getDailyData,
  getCategoryBreakdown,
} from '@/lib/calculations'
import { getDayName } from '@/lib/formatters'
import StatsCards from '@/components/dashboard/StatsCards'
import CashFlowChart from '@/components/dashboard/CashFlowChart'
import ExpenseByCategory from '@/components/dashboard/ExpenseByCategory'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import QuickAdd from '@/components/dashboard/QuickAdd'

type Period = 'week' | 'month' | 'year'

export default function DashboardPage() {
  const { store, isLoading } = useFinance()
  const [period, setPeriod] = useState<Period>('month')

  const dateRange = useMemo(() => {
    if (period === 'week') return getWeekRange()
    if (period === 'year') return getYearRange()
    return getMonthRange()
  }, [period])

  if (isLoading || !store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { wallets, transactions, categories, budgets } = store
  const totalBalance = getTotalBalance(wallets, transactions)
  const totalIncome = getTotalIncome(transactions, dateRange)
  const totalExpense = getTotalExpense(transactions, dateRange)
  const netCashFlow = getNetCashFlow(transactions, dateRange)
  const budgetUsage = getBudgetUsagePercent(budgets, transactions)
  const categoryBreakdown = getCategoryBreakdown(transactions, dateRange)

  const daily = getDailyData(transactions, dateRange)
  const chartData = period === 'week'
    ? daily.map((d) => ({ label: getDayName(d.date), income: d.income, expense: d.expense }))
    : daily
        .filter((d) => d.income > 0 || d.expense > 0)
        .map((d, i) => ({
          label: period === 'month' ? `${i + 1}` : new Date(d.date).toLocaleString('id-ID', { month: 'short' }),
          income: d.income,
          expense: d.expense,
        }))

  const periodLabels: Record<Period, string> = {
    week: 'Minggu Ini',
    month: 'Bulan Ini',
    year: 'Tahun Ini',
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Pantau kondisi keuanganmu</p>
        </div>
        {/* Period Filter */}
        <div className="flex items-center gap-1 bg-[var(--hover)] rounded-xl p-1">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <StatsCards
          totalBalance={totalBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netCashFlow={netCashFlow}
          budgetUsage={budgetUsage}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CashFlowChart
              data={chartData}
              title={`Income vs Pengeluaran — ${periodLabels[period]}`}
            />
          </div>
          <ExpenseByCategory
            data={categoryBreakdown}
            categories={categories}
            totalExpense={totalExpense}
          />
        </div>

        <RecentTransactions
          transactions={transactions}
          categories={categories}
          wallets={wallets}
        />
      </div>

      <QuickAdd />
    </div>
  )
}
