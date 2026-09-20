import { Transaction, Wallet, Budget, BudgetStatus, DateRange } from '@/types/finance'

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

export function getBudgetUsed(budget: Budget, transactions: Transaction[]): number {
  const start = new Date(budget.startDate)
  const end = new Date(budget.endDate)
  return transactions
    .filter((t) => {
      if (t.type !== 'expense') return false
      if (t.categoryId !== budget.categoryId) return false
      const d = new Date(t.date)
      return d >= start && d <= end
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getBudgetStatus(used: number, total: number): BudgetStatus {
  const pct = (used / total) * 100
  if (pct > 100) return 'exceeded'
  if (pct > 90) return 'danger'
  if (pct > 70) return 'warning'
  return 'safe'
}

export function getBudgetUsagePercent(budgets: Budget[], transactions: Transaction[]): number {
  if (budgets.length === 0) return 0
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalUsed = budgets.reduce((s, b) => s + getBudgetUsed(b, transactions), 0)
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
    const dayStr = current.toISOString().split('T')[0]
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
