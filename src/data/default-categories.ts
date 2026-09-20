import { Category, Wallet } from '@/types/finance'

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Belanja', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { name: 'Hiburan', type: 'expense', icon: '🎬', color: '#f59e0b' },
  { name: 'Internet', type: 'expense', icon: '📡', color: '#0ea5e9' },
  { name: 'Kesehatan', type: 'expense', icon: '🏥', color: '#10b981' },
  { name: 'Makanan', type: 'expense', icon: '🍽️', color: '#f97316' },
  { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#6366f1' },
  { name: 'Sedekah', type: 'expense', icon: '🤲', color: '#8b5cf6' },
  { name: 'Subscription', type: 'expense', icon: '📱', color: '#14b8a6' },
  { name: 'Tagihan', type: 'expense', icon: '📄', color: '#8b5cf6' },
  { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { name: 'Lainnya', type: 'expense', icon: '💸', color: '#6b7280' },
]

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Bisnis', type: 'income', icon: '🏢', color: '#8b5cf6' },
  { name: 'Bonus', type: 'income', icon: '🎁', color: '#ec4899' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#3b82f6' },
  { name: 'Gaji', type: 'income', icon: '💼', color: '#10b981' },
  { name: 'Investasi', type: 'income', icon: '📈', color: '#f59e0b' },
  { name: 'Lainnya', type: 'income', icon: '💰', color: '#6b7280' },
]

export const DEFAULT_WALLETS: Omit<Wallet, 'id' | 'createdAt'>[] = [
  { name: 'Savings', icon: '🏦', color: '#10b981', initialBalance: 0 },
  { name: 'Needs', icon: '🏠', color: '#3b82f6', initialBalance: 0 },
  { name: 'Wants', icon: '🛍️', color: '#f59e0b', initialBalance: 0 },
  { name: 'Sedekah', icon: '🤲', color: '#8b5cf6', initialBalance: 0 },
]

export const DEFAULT_ALLOCATION_RULE = {
  name: 'Spread',
  allocations: [
    { wallet: 'Savings', label: 'Savings', percentage: 20 },
    { wallet: 'Needs', label: 'Needs', percentage: 50 },
    { wallet: 'Wants', label: 'Wants', percentage: 25 },
    { wallet: 'Sedekah', label: 'Sedekah', percentage: 5 },
  ],
}

export const WALLET_ICONS = ['💳', '🏦', '💵', '👝', '🏧', '💰', '🪙', '📊']

export const WALLET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6',
  '#f97316', '#6366f1',
]
