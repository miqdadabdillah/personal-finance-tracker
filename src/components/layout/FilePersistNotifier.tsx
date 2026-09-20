'use client'

import { useEffect } from 'react'
import { useToast } from '@/context/ToastContext'
import { setOnPersistError } from '@/lib/fileStorage'

export function FilePersistNotifier() {
  const { error } = useToast()

  useEffect(() => {
    setOnPersistError((message) => error(message))
    return () => setOnPersistError(null)
  }, [error])

  return null
}