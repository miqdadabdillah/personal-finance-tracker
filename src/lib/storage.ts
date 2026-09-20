import { FinanceStore, Settings, AllocationRule } from '@/types/finance'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_WALLETS, DEFAULT_ALLOCATION_RULE } from '@/data/default-categories'
import { generateId, todayISO } from './formatters'

const STORAGE_KEY = 'financeApp'

const DEFAULT_SETTINGS: Settings = {
  currency: 'IDR',
  locale: 'id-ID',
  theme: 'light',
}

function getDefaultStore(): FinanceStore {
  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    id: generateId(),
  }))
  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((c) => ({
    ...c,
    id: generateId(),
  }))
  const wallets = DEFAULT_WALLETS.map((w) => ({
    ...w,
    id: generateId(),
    createdAt: todayISO(),
  }))

  const walletIdByName = Object.fromEntries(wallets.map((w) => [w.name, w.id]))
  const allocationRules: AllocationRule[] = [
    {
      id: generateId(),
      name: DEFAULT_ALLOCATION_RULE.name,
      createdAt: todayISO(),
      allocations: DEFAULT_ALLOCATION_RULE.allocations.map((a) => ({
        targetId: walletIdByName[a.wallet] ?? '',
        targetType: 'wallet' as const,
        percentage: a.percentage,
        label: a.label,
      })),
    },
  ]

  return {
    wallets,
    transactions: [],
    categories: [...expenseCategories, ...incomeCategories],
    budgets: [],
    allocationRules,
    settings: DEFAULT_SETTINGS,
  }
}

export function getData(): FinanceStore {
  if (typeof window === 'undefined') return getDefaultStore()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = getDefaultStore()
      saveData(defaults)
      return defaults
    }
    const parsed = JSON.parse(raw) as FinanceStore
    // Ensure all keys exist (backwards compat)
    return {
      wallets: parsed.wallets ?? [],
      transactions: parsed.transactions ?? [],
      categories: parsed.categories ?? getDefaultStore().categories,
      budgets: parsed.budgets ?? [],
      allocationRules: parsed.allocationRules ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    }
  } catch {
    return getDefaultStore()
  }
}

export function saveData(data: FinanceStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save data:', e)
  }
}

export function exportData(): string {
  const data = getData()
  return JSON.stringify(data, null, 2)
}

export function importData(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString)
    if (
      !Array.isArray(parsed.wallets) ||
      !Array.isArray(parsed.transactions) ||
      !Array.isArray(parsed.categories)
    ) {
      return { success: false, error: 'Invalid data format' }
    }
    saveData(parsed as FinanceStore)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to parse JSON file' }
  }
}

export function clearData(): void {
  if (typeof window === 'undefined') return
  const defaults = getDefaultStore()
  saveData(defaults)
}
