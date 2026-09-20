'use client'

import { useState, useEffect, useCallback } from 'react'
import { FinanceStore } from '@/types/finance'
import { getData, saveData } from '@/lib/storage'
import { initActiveFile, persistToActiveFile } from '@/lib/fileStorage'

export function useFinanceStore() {
  const [store, setStore] = useState<FinanceStore | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const data = getData()
    setStore(data)
    setIsLoading(false)
    void initActiveFile()
  }, [])

  const updateStore = useCallback((updater: (prev: FinanceStore) => FinanceStore) => {
    setStore((prev) => {
      if (!prev) return prev
      const next = updater(prev)
      saveData(next)
      void persistToActiveFile(next)
      return next
    })
  }, [])

  return { store, updateStore, isLoading }
}
