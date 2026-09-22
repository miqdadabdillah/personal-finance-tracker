'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { FinanceStore, Wallet, Transaction, Category, Budget, AllocationRule, Settings, DebtRecord, DebtPayment } from '@/types/finance'
import { useFinanceStore } from '@/hooks/useFinanceStore'
import { generateId, todayISO } from '@/lib/formatters'
import { getWalletBalance, getAllocationAmount, getDebtPaid } from '@/lib/calculations'
import { getData, clearData } from '@/lib/storage'

interface FinanceContextType {
  store: FinanceStore | null
  isLoading: boolean
  // Wallets
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => void
  updateWallet: (id: string, wallet: Partial<Wallet>) => void
  deleteWallet: (id: string) => void
  moveWallet: (id: string, direction: -1 | 1) => void
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void
  addIncomeWithAllocation: (transaction: Omit<Transaction, 'id' | 'createdAt'>, ruleId: string) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, category: Partial<Category>) => void
  deleteCategory: (id: string) => void
  // Budgets
  addBudget: (budget: Omit<Budget, 'id'>) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  // Allocation Rules
  addAllocationRule: (rule: Omit<AllocationRule, 'id' | 'createdAt'>) => void
  updateAllocationRule: (id: string, rule: Partial<AllocationRule>) => void
  deleteAllocationRule: (id: string) => void
  // Debts
  addDebt: (debt: Omit<DebtRecord, 'id' | 'createdAt' | 'payments'>) => void
  updateDebt: (id: string, debt: Partial<DebtRecord>) => void
  deleteDebt: (id: string) => void
  addDebtPayment: (debtId: string, payment: Omit<DebtPayment, 'id'>) => void
  deleteDebtPayment: (debtId: string, paymentId: string) => void
  // Settings
  updateSettings: (settings: Partial<Settings>) => void
  // Data management
  resetData: () => void
  importData: (data: FinanceStore) => void
}

const FinanceContext = createContext<FinanceContextType | null>(null)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { store, updateStore, isLoading } = useFinanceStore()

  const addWallet = (wallet: Omit<Wallet, 'id' | 'createdAt'>) => {
    updateStore((prev) => ({
      ...prev,
      wallets: [...prev.wallets, { ...wallet, id: generateId(), createdAt: todayISO() }],
    }))
  }

  const updateWallet = (id: string, wallet: Partial<Wallet>) => {
    updateStore((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => (w.id === id ? { ...w, ...wallet } : w)),
    }))
  }

  const deleteWallet = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => w.id !== id),
      transactions: prev.transactions.filter(
        (t) => t.walletId !== id && t.toWalletId !== id
      ),
    }))
  }

  const moveWallet = (id: string, direction: -1 | 1) => {
    updateStore((prev) => {
      const idx = prev.wallets.findIndex((w) => w.id === id)
      const newIdx = idx + direction
      if (idx === -1 || newIdx < 0 || newIdx >= prev.wallets.length) return prev
      const wallets = [...prev.wallets]
      const [item] = wallets.splice(idx, 1)
      wallets.splice(newIdx, 0, item)
      return { ...prev, wallets }
    })
  }

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    updateStore((prev) => ({
      ...prev,
      transactions: [
        ...prev.transactions,
        { ...transaction, id: generateId(), createdAt: todayISO() },
      ],
    }))
  }

  const addIncomeWithAllocation = (
    transaction: Omit<Transaction, 'id' | 'createdAt'>,
    ruleId: string
  ) => {
    updateStore((prev) => {
      const rule = prev.allocationRules.find((r) => r.id === ruleId)
      if (!rule) return prev

      const newTxns: Transaction[] = [
        { ...transaction, id: generateId(), createdAt: todayISO(), allocationRuleId: ruleId },
      ]

      // Create allocation transactions for each wallet target
      for (const alloc of rule.allocations) {
        if (alloc.targetType === 'wallet' && alloc.targetId !== transaction.walletId) {
          const allocAmount = getAllocationAmount(transaction.amount, alloc.percentage)
          newTxns.push({
            id: generateId(),
            type: 'transfer',
            amount: allocAmount,
            walletId: transaction.walletId,
            toWalletId: alloc.targetId,
            note: `Auto allocation: ${alloc.label ?? alloc.targetId}`,
            date: transaction.date,
            createdAt: todayISO(),
          })
        }
      }

      return { ...prev, transactions: [...prev.transactions, ...newTxns] }
    })
  }

  const updateTransaction = (id: string, transaction: Partial<Transaction>) => {
    updateStore((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...transaction } : t)),
    }))
  }

  const deleteTransaction = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }))
  }

  const addCategory = (category: Omit<Category, 'id'>) => {
    updateStore((prev) => {
      const categories = [...prev.categories, { ...category, id: generateId() }].sort((a, b) => {
        const aOther = a.name.toLowerCase() === 'lainnya' ? 1 : 0
        const bOther = b.name.toLowerCase() === 'lainnya' ? 1 : 0
        if (aOther !== bOther) return aOther - bOther
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
      return { ...prev, categories }
    })
  }

  const updateCategory = (id: string, category: Partial<Category>) => {
    updateStore((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
    }))
  }

  const deleteCategory = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }))
  }

  const addBudget = (budget: Omit<Budget, 'id'>) => {
    updateStore((prev) => ({
      ...prev,
      budgets: [...prev.budgets, { ...budget, id: generateId() }],
    }))
  }

  const updateBudget = (id: string, budget: Partial<Budget>) => {
    updateStore((prev) => ({
      ...prev,
      budgets: prev.budgets.map((b) => (b.id === id ? { ...b, ...budget } : b)),
    }))
  }

  const deleteBudget = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }))
  }

  const addAllocationRule = (rule: Omit<AllocationRule, 'id' | 'createdAt'>) => {
    updateStore((prev) => ({
      ...prev,
      allocationRules: [
        ...prev.allocationRules,
        { ...rule, id: generateId(), createdAt: todayISO() },
      ],
    }))
  }

  const updateAllocationRule = (id: string, rule: Partial<AllocationRule>) => {
    updateStore((prev) => ({
      ...prev,
      allocationRules: prev.allocationRules.map((r) =>
        r.id === id ? { ...r, ...rule } : r
      ),
    }))
  }

  const deleteAllocationRule = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      allocationRules: prev.allocationRules.filter((r) => r.id !== id),
    }))
  }

  const addDebt = (debt: Omit<DebtRecord, 'id' | 'createdAt' | 'payments'>) => {
    updateStore((prev) => ({
      ...prev,
      debts: [
        ...prev.debts,
        { ...debt, id: generateId(), payments: [], createdAt: todayISO() },
      ],
    }))
  }

  const updateDebt = (id: string, debt: Partial<DebtRecord>) => {
    updateStore((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === id ? { ...d, ...debt } : d)),
    }))
  }

  const deleteDebt = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }))
  }

  const addDebtPayment = (debtId: string, payment: Omit<DebtPayment, 'id'>) => {
    updateStore((prev) => {
      const debt = prev.debts.find((d) => d.id === debtId)
      if (!debt) return prev

      const newPayment: DebtPayment = { ...payment, id: generateId() }
      const paid = getDebtPaid(debt) + payment.amount
      const settledAt = paid >= debt.amount ? todayISO() : undefined

      const debts = prev.debts.map((d) =>
        d.id === debtId
          ? { ...d, payments: [...d.payments, newPayment], settledAt: settledAt ?? d.settledAt }
          : d
      )

      let transactions = prev.transactions
      if (payment.walletId && payment.amount > 0) {
        const txn: Transaction = {
          id: generateId(),
          type: debt.type === 'lend' ? 'income' : 'expense',
          amount: payment.amount,
          walletId: payment.walletId,
          date: payment.date,
          source: debt.type === 'lend'
            ? `Pembayaran piutang dari ${debt.name}`
            : `Pembayaran hutang ke ${debt.name}`,
          note: payment.note ?? '',
          createdAt: todayISO(),
        }
        transactions = [...transactions, txn]
      }

      return { ...prev, debts, transactions }
    })
  }

  const deleteDebtPayment = (debtId: string, paymentId: string) => {
    updateStore((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => {
        if (d.id !== debtId) return d
        const payments = d.payments.filter((p) => p.id !== paymentId)
        const paid = payments.reduce((s, p) => s + p.amount, 0)
        return { ...d, payments, settledAt: paid >= d.amount ? d.settledAt : undefined }
      }),
    }))
  }

  const updateSettings = (settings: Partial<Settings>) => {
    updateStore((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }))
  }

  const resetData = () => {
    clearData()
    updateStore(() => getData())
  }

  const importData = (data: FinanceStore) => {
    updateStore(() => data)
  }

  return (
    <FinanceContext.Provider
      value={{
        store,
        isLoading,
        addWallet,
        updateWallet,
        deleteWallet,
        moveWallet,
        addTransaction,
        addIncomeWithAllocation,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        addAllocationRule,
        updateAllocationRule,
        deleteAllocationRule,
        addDebt,
        updateDebt,
        deleteDebt,
        addDebtPayment,
        deleteDebtPayment,
        updateSettings,
        resetData,
        importData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}

export { getWalletBalance }
export type { FinanceContextType }
