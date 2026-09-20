import React from 'react'
import { BudgetStatus } from '@/types/finance'

interface ProgressBarProps {
  value: number // percentage 0-100+
  status: BudgetStatus
  showLabel?: boolean
}

const statusColors: Record<BudgetStatus, string> = {
  safe: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-orange-500',
  exceeded: 'bg-red-500',
}

const statusLabels: Record<BudgetStatus, string> = {
  safe: 'Aman',
  warning: 'Perhatian',
  danger: 'Hampir Habis',
  exceeded: 'Melebihi Budget',
}

export default function ProgressBar({ value, status, showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(value, 100)
  return (
    <div className="space-y-1.5">
      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusColors[status]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">{statusLabels[status]}</span>
          <span
            className={`font-medium ${
              status === 'exceeded' ? 'text-red-500' :
              status === 'danger' ? 'text-orange-500' :
              status === 'warning' ? 'text-amber-500' : 'text-emerald-500'
            }`}
          >
            {value.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  )
}
