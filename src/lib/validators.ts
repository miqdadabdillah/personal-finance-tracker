import { AllocationTarget } from '@/types/finance'

export type ValidationResult = { valid: boolean; error?: string }

export function validateAmount(amount: number | string): ValidationResult {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.]/g, '')) : amount
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }
  return { valid: true }
}

export function validateRequired(value: string | undefined | null, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` }
  }
  return { valid: true }
}

export function validateAllocationTotal(allocations: AllocationTarget[]): ValidationResult {
  const total = allocations.reduce((sum, a) => sum + a.percentage, 0)
  if (Math.round(total) !== 100) {
    return {
      valid: false,
      error: `Allocation must equal 100% (currently ${total.toFixed(1)}%)`,
    }
  }
  return { valid: true }
}

export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  if (new Date(startDate) > new Date(endDate)) {
    return { valid: false, error: 'Start date must be before end date' }
  }
  return { valid: true }
}

export function validateWallet(walletId: string | undefined): ValidationResult {
  if (!walletId) return { valid: false, error: 'Please select a wallet' }
  return { valid: true }
}

export function parseAmount(input: string): number {
  return parseFloat(input.replace(/[^0-9.]/g, '')) || 0
}
