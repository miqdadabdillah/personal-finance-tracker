import React from 'react'
import { getPercentChange } from '@/lib/calculations'

interface DeltaBadgeProps {
  value: number
  previous: number
  positive: boolean
  label: string
}

export default function DeltaBadge({ value, previous, positive, label }: DeltaBadgeProps) {
  const pct = getPercentChange(value, previous)
  if (pct === null) {
    return <p className="text-[10px] text-[var(--text-muted)] mt-1">Belum ada data {label}</p>
  }
  if (pct === 0) {
    return <p className="text-[10px] text-[var(--text-muted)] mt-1">Sama seperti {label}</p>
  }
  const good = (pct > 0) === positive
  const color = good ? 'text-emerald-400' : 'text-red-400'
  const arrow = pct > 0 ? '▲' : '▼'
  return (
    <p className={`text-[10px] font-semibold ${color} mt-1`}>
      {arrow} {Math.abs(pct).toFixed(1)}% {label}
    </p>
  )
}