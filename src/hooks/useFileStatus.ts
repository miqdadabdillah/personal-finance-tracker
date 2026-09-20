'use client'

import { useEffect, useState } from 'react'
import { getFileStatus, subscribeFileStatus, FileStatus } from '@/lib/fileStorage'

export function useFileStatus(): FileStatus {
  const [status, setStatus] = useState<FileStatus>(getFileStatus)

  useEffect(() => subscribeFileStatus(setStatus), [])

  return status
}