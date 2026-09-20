'use client'

import { useEffect } from 'react'
import { useFinance } from '@/context/FinanceContext'

export default function ThemeSetter() {
  const { store } = useFinance()
  const theme = store?.settings.theme ?? 'light'

  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: light)')

    const apply = () => {
      const resolved =
        theme === 'system' ? (mq.matches ? 'light' : 'dark') : theme
      root.setAttribute('data-theme', resolved)
    }

    apply()

    if (theme === 'system') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  return null
}