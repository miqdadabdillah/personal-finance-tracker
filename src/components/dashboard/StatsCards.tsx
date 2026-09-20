'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Wallet, Activity, Target, ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatCompact } from '@/lib/formatters'

interface StatsCardsProps {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  netCashFlow: number
  budgetUsage: number
}

export default function StatsCards({
  totalBalance,
  totalIncome,
  totalExpense,
  netCashFlow,
  budgetUsage,
}: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Saldo',
      value: formatCurrency(totalBalance),
      icon: Wallet,
      color: 'from-violet-500 to-indigo-600',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
      trend: null,
    },
    {
      label: 'Pemasukan',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      trend: '+',
    },
    {
      label: 'Pengeluaran',
      value: formatCurrency(totalExpense),
      icon: TrendingDown,
      color: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      trend: '-',
    },
    {
      label: 'Cash Flow',
      value: (netCashFlow >= 0 ? '+' : '') + formatCurrency(netCashFlow),
      icon: Activity,
      color: netCashFlow >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600',
      iconBg: netCashFlow >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20',
      iconColor: netCashFlow >= 0 ? 'text-blue-400' : 'text-orange-400',
      trend: null,
    },
    {
      label: 'Budget Terpakai',
      value: `${budgetUsage}%`,
      icon: Target,
      color:
        budgetUsage > 90
          ? 'from-red-500 to-rose-600'
          : budgetUsage > 70
          ? 'from-amber-500 to-orange-600'
          : 'from-emerald-500 to-teal-600',
      iconBg:
        budgetUsage > 90
          ? 'bg-red-500/20'
          : budgetUsage > 70
          ? 'bg-amber-500/20'
          : 'bg-emerald-500/20',
      iconColor:
        budgetUsage > 90
          ? 'text-red-400'
          : budgetUsage > 70
          ? 'text-amber-400'
          : 'text-emerald-400',
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <div
            key={i}
            className={`card group relative overflow-hidden ${
              i === 0 ? 'col-span-2 lg:col-span-2' : 'col-span-1'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon size={18} className={card.iconColor} />
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-[var(--text-muted)] font-medium mb-1">{card.label}</p>
            <p className={`font-bold text-[var(--text-primary)] ${i === 0 ? 'text-2xl' : 'text-lg'} tabular-nums`}>
              {card.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
