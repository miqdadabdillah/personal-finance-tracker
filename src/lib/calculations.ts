import { Transaction, Wallet, Budget, BudgetStatus, DateRange, DebtRecord } from '@/types/finance'
import { toLocalDateString } from '@/lib/formatters'

export function getWalletBalance(wallet: Wallet, transactions: Transaction[]): number {
  const walletTxns = transactions.filter(
    (t) => t.walletId === wallet.id || t.toWalletId === wallet.id
  )
  let balance = wallet.initialBalance
  for (const t of walletTxns) {
    if (t.type === 'income' && t.walletId === wallet.id) {
      balance += t.amount
    } else if (t.type === 'expense' && t.walletId === wallet.id) {
      balance -= t.amount
    } else if (t.type === 'transfer') {
      if (t.walletId === wallet.id) balance -= t.amount
      if (t.toWalletId === wallet.id) balance += t.amount
    }
  }
  return balance
}

export function getTotalBalance(wallets: Wallet[], transactions: Transaction[]): number {
  return wallets.reduce((sum, w) => sum + getWalletBalance(w, transactions), 0)
}

export function getTotalIncome(transactions: Transaction[], dateRange?: DateRange): number {
  const txns = dateRange ? filterByDate(transactions, dateRange) : transactions
  return txns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getTotalExpense(transactions: Transaction[], dateRange?: DateRange): number {
  const txns = dateRange ? filterByDate(transactions, dateRange) : transactions
  return txns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getNetCashFlow(transactions: Transaction[], dateRange?: DateRange): number {
  return getTotalIncome(transactions, dateRange) - getTotalExpense(transactions, dateRange)
}

export function getPercentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

export function getBudgetStatus(used: number, total: number): BudgetStatus {
  const pct = (used / total) * 100
  if (pct > 100) return 'exceeded'
  if (pct > 90) return 'danger'
  if (pct > 70) return 'warning'
  return 'safe'
}

// ─── Budget rolling periods ─────────────────────────
const MS_PER_DAY = 86_400_000

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

function weekRange(start: Date): DateRange {
  const from = new Date(start)
  from.setHours(0, 0, 0, 0)
  const to = new Date(start)
  to.setDate(to.getDate() + 6)
  to.setHours(23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

// Periods (weekly/monthly/yearly) are anchored to the budget's start date and
// always track the CURRENT running period. Custom stays fixed.
export function getBudgetPeriodRanges(
  budget: Budget,
  now: Date = new Date()
): { expired: DateRange[]; current: DateRange } {
  if (budget.period === 'custom') {
    return { expired: [], current: { from: budget.startDate, to: budget.endDate } }
  }

  const start = new Date(budget.startDate)
  const expired: DateRange[] = []
  let current: DateRange

  if (budget.period === 'monthly') {
    const elapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    const count = Math.max(elapsed, 0)
    for (let i = 0; i < count; i++) {
      expired.push(getMonthRange(start.getFullYear(), start.getMonth() + i))
    }
    current = getMonthRange(start.getFullYear(), start.getMonth() + count)
  } else if (budget.period === 'weekly') {
    const anchor = startOfWeek(start)
    const today = startOfWeek(now)
    const count = Math.max(Math.floor((today.getTime() - anchor.getTime()) / MS_PER_DAY / 7), 0)
    for (let i = 0; i < count; i++) {
      expired.push(weekRange(new Date(anchor.getTime() + i * 7 * MS_PER_DAY)))
    }
    current = weekRange(new Date(anchor.getTime() + count * 7 * MS_PER_DAY))
  } else {
    const count = Math.max(now.getFullYear() - start.getFullYear(), 0)
    for (let i = 0; i < count; i++) {
      expired.push(getYearRange(start.getFullYear() + i))
    }
    current = getYearRange(start.getFullYear() + count)
  }

  return { expired, current }
}

export function getBudgetActiveRange(budget: Budget): DateRange {
  return getBudgetPeriodRanges(budget).current
}

export function getBudgetUsed(budget: Budget, transactions: Transaction[]): number {
  const range = getBudgetActiveRange(budget)
  const from = new Date(range.from).getTime()
  const to = new Date(range.to).getTime()
  return transactions.reduce((sum, t) => {
    if (t.type !== 'expense' || t.categoryId !== budget.categoryId) return sum
    const time = new Date(t.date).getTime()
    if (time < from || time > to) return sum
    return sum + t.amount
  }, 0)
}

// Surplus (positive) carried over from every expired period. Overspend is reset (never deducted).
export function getBudgetCarryOver(budget: Budget, transactions: Transaction[]): number {
  if (budget.carryOver === false) return 0
  const ranges = getBudgetPeriodRanges(budget)
  let carry = 0
  for (const range of ranges.expired) {
    const from = new Date(range.from).getTime()
    const to = new Date(range.to).getTime()
    let used = 0
    for (const t of transactions) {
      if (t.type !== 'expense' || t.categoryId !== budget.categoryId) continue
      const time = new Date(t.date).getTime()
      if (time >= from && time <= to) used += t.amount
    }
    carry += Math.max(budget.amount - used, 0)
  }
  return carry
}

// Total spending power this period: jatah asli + sisa positif terbawa.
export function getBudgetAvailable(budget: Budget, transactions: Transaction[]): number {
  return budget.amount + getBudgetCarryOver(budget, transactions)
}

export function getBudgetUsagePercent(budgets: Budget[], transactions: Transaction[]): number {
  if (budgets.length === 0) return 0
  let totalBudget = 0
  let totalUsed = 0
  for (const b of budgets) {
    totalBudget += getBudgetAvailable(b, transactions)
    totalUsed += getBudgetUsed(b, transactions)
  }
  if (totalBudget === 0) return 0
  return Math.min(Math.round((totalUsed / totalBudget) * 100), 100)
}

export function getAllocationAmount(income: number, percentage: number): number {
  return Math.round((income * percentage) / 100)
}

export function filterByDate(transactions: Transaction[], range: DateRange): Transaction[] {
  const from = new Date(range.from)
  const to = new Date(range.to)
  return transactions.filter((t) => {
    const d = new Date(t.date)
    return d >= from && d <= to
  })
}

export function getDebtPaid(debt: DebtRecord): number {
  return debt.payments.reduce((sum, p) => sum + p.amount, 0)
}

export function getDebtRemaining(debt: DebtRecord): number {
  return Math.max(debt.amount - getDebtPaid(debt), 0)
}

export function getDebtSummary(debts: DebtRecord[]) {
  let totalLend = 0
  let totalBorrow = 0
  let settledLend = 0
  let settledBorrow = 0
  for (const d of debts) {
    const remaining = getDebtRemaining(d)
    if (remaining === 0) {
      if (d.type === 'lend') settledLend += d.amount
      else settledBorrow += d.amount
      continue
    }
    if (d.type === 'lend') totalLend += remaining
    else totalBorrow += remaining
  }
  return { totalLend, totalBorrow, net: totalLend - totalBorrow, settledLend, settledBorrow }
}

export function isDebtOverdue(debt: DebtRecord): boolean {
  if (!debt.dueDate || getDebtRemaining(debt) <= 0) return false
  return new Date(debt.dueDate).getTime() < new Date().getTime()
}

export function getWeekRange(): DateRange {
  const now = new Date()
  const day = now.getDay()
  const from = new Date(now)
  from.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(from.getDate() + 6)
  to.setHours(23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function getMonthRange(year?: number, month?: number): DateRange {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = month ?? now.getMonth()
  const from = new Date(y, m, 1)
  const to = new Date(y, m + 1, 0, 23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function getYearRange(year?: number): DateRange {
  const y = year ?? new Date().getFullYear()
  const from = new Date(y, 0, 1)
  const to = new Date(y, 11, 31, 23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function getDailyData(transactions: Transaction[], dateRange: DateRange) {
  const days: { date: string; income: number; expense: number }[] = []
  const from = new Date(dateRange.from)
  const to = new Date(dateRange.to)
  const current = new Date(from)
  while (current <= to) {
    const dayStr = toLocalDateString(current)
    const dayTxns = transactions.filter((t) => t.date.startsWith(dayStr))
    days.push({
      date: current.toISOString(),
      income: dayTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: dayTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    })
    current.setDate(current.getDate() + 1)
  }
  return days
}

export function getMonthlyData(transactions: Transaction[], year: number) {
  return Array.from({ length: 12 }, (_, m) => {
    const range = getMonthRange(year, m)
    const txns = filterByDate(transactions, range)
    return {
      month: m,
      income: txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  dateRange?: DateRange
): { categoryId: string; total: number }[] {
  const txns = dateRange ? filterByDate(transactions, dateRange) : transactions
  const expense = txns.filter((t) => t.type === 'expense')
  const map: Record<string, number> = {}
  for (const t of expense) {
    const key = t.categoryId ?? 'unknown'
    map[key] = (map[key] ?? 0) + t.amount
  }
  return Object.entries(map)
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total)
}
