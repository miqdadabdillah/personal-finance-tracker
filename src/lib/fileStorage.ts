import { FinanceStore } from '@/types/finance'

declare global {
  interface SaveFilePickerOptions {
    suggestedName?: string
    types?: Array<{ description?: string; accept: Record<string, string[]> }>
  }
  interface OpenFilePickerOptions {
    multiple?: boolean
    types?: Array<{ description?: string; accept: Record<string, string[]> }>
  }
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>
    showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>
  }
  interface FileSystemHandle {
    queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
    requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
  }
}

const IDB_NAME = 'financeHandleDB'
const IDB_STORE = 'handles'
const HANDLE_KEY = 'active'

let activeHandle: FileSystemFileHandle | null = null
let activeFileName: string | null = null
let writeQueue: Promise<void> = Promise.resolve()
let onPersistError: ((message: string) => void) | null = null

export type FileStatus = { connected: boolean; name: string | null }

const statusListeners = new Set<(status: FileStatus) => void>()

export function setOnPersistError(handler: ((message: string) => void) | null): void {
  onPersistError = handler
}

export function getFileStatus(): FileStatus {
  return { connected: activeHandle !== null, name: activeFileName }
}

export function subscribeFileStatus(listener: (status: FileStatus) => void): () => void {
  statusListeners.add(listener)
  return () => void statusListeners.delete(listener)
}

function emitStatus(): void {
  const status = getFileStatus()
  for (const listener of statusListeners) listener(status)
}

const FILE_TYPES = [
  {
    description: 'JSON file',
    accept: { 'application/json': ['.json'] },
  },
]

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

export function isFileConnected(): boolean {
  return activeHandle !== null
}

export function getActiveFileName(): string | null {
  return activeFileName
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function storeHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getStoredHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(HANDLE_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function clearStoredHandle(): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete(HANDLE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // ignore
  }
}

async function ensurePermission(handle: FileSystemFileHandle): Promise<boolean> {
  if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true
  return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted'
}

async function writeToHandle(handle: FileSystemFileHandle, data: FinanceStore): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(data, null, 2))
  await writable.close()
}

function enqueueWrite(task: () => Promise<void>): Promise<void> {
  const run = writeQueue.then(task, task)
  writeQueue = run.catch(() => {
    // keep queue alive even if a write fails
  })
  return run
}

async function connectHandle(handle: FileSystemFileHandle): Promise<void> {
  const granted = await ensurePermission(handle)
  if (!granted) throw new Error('Izin akses file ditolak')
  activeHandle = handle
  activeFileName = handle.name
  try {
    await storeHandle(handle)
  } catch {
    // handle not persistable across reloads, keep in-memory only
  }
  emitStatus()
}

export async function initActiveFile(): Promise<void> {
  if (!isFileSystemAccessSupported()) return
  const handle = await getStoredHandle()
  if (!handle) return
  if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
    await clearStoredHandle()
    return
  }
  activeHandle = handle
  activeFileName = handle.name
  emitStatus()
}

export async function saveToLocalFile(data: FinanceStore): Promise<string> {
  const w = window as Window & { showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle> }
  if (!w.showSaveFilePicker) throw new Error('Fitur ini hanya didukung di browser Chrome/Edge di desktop')
  const handle = await w.showSaveFilePicker({
    suggestedName: 'finance-data.json',
    types: FILE_TYPES,
  })
  await saveToConnectedHandle(handle, data)
  return activeFileName ?? handle.name
}

export async function saveToConnectedHandle(handle: FileSystemFileHandle, data: FinanceStore): Promise<void> {
  await enqueueWrite(() => writeToHandle(handle, data))
  await connectHandle(handle)
}

export async function openLocalFile(): Promise<{ data: FinanceStore; name: string }> {
  const w = window as Window & { showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]> }
  if (!w.showOpenFilePicker) throw new Error('Fitur ini hanya didukung di browser Chrome/Edge di desktop')
  const [handle] = await w.showOpenFilePicker({ multiple: false, types: FILE_TYPES })
  const file = await handle.getFile()
  const text = await file.text()
  const parsed = JSON.parse(text) as FinanceStore
  if (
    !Array.isArray(parsed.wallets) ||
    !Array.isArray(parsed.transactions) ||
    !Array.isArray(parsed.categories)
  ) {
    throw new Error('Format file tidak valid')
  }
  await connectHandle(handle)
  return { data: parsed, name: handle.name }
}

export async function persistToActiveFile(data: FinanceStore): Promise<boolean> {
  if (!isFileSystemAccessSupported()) return true
  const handle = activeHandle
  if (!handle) return true
  if (!(await ensurePermission(handle))) {
    const message = 'Koneksi ke file lokal terputus. Sambungkan ulang di Pengaturan.'
    await disconnectLocalFile()
    onPersistError?.(message)
    return false
  }
  try {
    await enqueueWrite(() => writeToHandle(handle, data))
    return true
  } catch {
    const message = 'Gagal menyimpan ke file lokal. Koneksi terputus.'
    await disconnectLocalFile()
    onPersistError?.(message)
    return false
  }
}

export async function disconnectLocalFile(): Promise<void> {
  activeHandle = null
  activeFileName = null
  await clearStoredHandle()
  emitStatus()
}