export type Wallet = {
  id: string
  name: string
  icon?: string
  color?: string
  initialBalance: number
  createdAt: string
}

export type TransactionType = 'income' | 'expense' | 'transfer'

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  walletId: string
  toWalletId?: string // for transfer
  categoryId?: string
  source?: string
  note?: string
  date: string
  createdAt: string
  allocationRuleId?: string
}

export type CategoryType = 'income' | 'expense'

export type Category = {
  id: string
  name: string
  type: CategoryType
  icon?: string
  color?: string
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom'

export type Budget = {
  id: string
  categoryId: string
  amount: number
  period: BudgetPeriod
  startDate: string
  endDate: string
  // Jika false, sisa hemat TIDAK dibawa ke periode berikutnya (reset ke 0).
  // Undefined = true (bawa sisa), agar budget lama tetap berperilaku sama.
  carryOver?: boolean
}

export type AllocationTarget = {
  targetId: string
  targetType: 'wallet' | 'budget'
  percentage: number
  label?: string
}

export type AllocationRule = {
  id: string
  name: string
  allocations: AllocationTarget[]
  createdAt: string
}

export type Settings = {
  currency: string
  locale: string
  theme: 'light' | 'dark' | 'system'
}

export type DebtType = 'lend' | 'borrow'

export type DebtPayment = {
  id: string
  amount: number
  date: string
  walletId?: string
  note?: string
}

export type DebtRecord = {
  id: string
  type: DebtType
  name: string
  amount: number
  dueDate?: string
  note?: string
  payments: DebtPayment[]
  createdAt: string
  settledAt?: string
}

export type FinanceStore = {
  wallets: Wallet[]
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  allocationRules: AllocationRule[]
  debts: DebtRecord[]
  settings: Settings
}

export type PeriodFilter = 'week' | 'month' | 'year' | 'custom'

export type DateRange = {
  from: string
  to: string
}

export type BudgetStatus = 'safe' | 'warning' | 'danger' | 'exceeded'

export type StatsSummary = {
  totalIncome: number
  totalExpense: number
  netCashFlow: number
  savings: number
}
