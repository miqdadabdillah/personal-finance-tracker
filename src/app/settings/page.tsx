'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { exportData, importData } from '@/lib/storage'
import { clearData } from '@/lib/storage'
import { FinanceStore } from '@/types/finance'
import { Download, Upload, Trash2, Shield, Database, Sun, Moon, Monitor, Plus, Pencil, Trash, Save, FolderOpen, HardDrive, Unlink } from 'lucide-react'
import {
  saveToLocalFile, openLocalFile, disconnectLocalFile,
  isFileSystemAccessSupported,
} from '@/lib/fileStorage'
import { useFileStatus } from '@/hooks/useFileStatus'

export default function SettingsPage() {
  const { store, updateSettings, resetData, importData: ctxImport } = useFinance()
  const { success, error } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showReset, setShowReset] = useState(false)

  const settings = store?.settings
  const categories = store?.categories ?? []

  // Export
  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    success('Data berhasil diekspor!')
  }

  // Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      const res = importData(result)
      if (res.success) {
        ctxImport(JSON.parse(result) as FinanceStore)
        success('Data berhasil diimpor!')
      } else {
        error(res.error ?? 'Gagal mengimpor data')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Reset
  const handleReset = () => {
    resetData()
    clearData()
    window.location.reload()
  }

  const themeOptions = [
    { value: 'light', label: 'Terang', icon: Sun },
    { value: 'dark', label: 'Gelap', icon: Moon },
    { value: 'system', label: 'Sistem', icon: Monitor },
  ] as const

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pengaturan</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Konfigurasi & manajemen data</p>
      </div>

      {/* Theme */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Tampilan</h2>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateSettings({ theme: value })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                settings?.theme === value
                  ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-violet-500/40'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Backup & Restore</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Ekspor dan impor semua data keuanganmu</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            className="btn-primary flex items-center justify-center gap-2 flex-1"
          >
            <Download size={16} /> Ekspor Data
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-ghost flex items-center justify-center gap-2 flex-1"
          >
            <Upload size={16} /> Impor Data
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          File backup: <code className="text-violet-400">finance-backup-YYYY-MM-DD.json</code>
        </p>
      </div>

      {/* Local file storage */}
      <LocalFileManager />

      {/* Categories */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Kategori</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">{categories.length} kategori tersimpan</p>
        <CategoryManager />
      </div>

      {/* Privacy */}
      <div className="card border border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Privasi & Keamanan</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Seluruh data keuanganmu disimpan secara lokal di browser ini menggunakan Local Storage.
              Kami <strong className="text-[var(--text-primary)]">tidak mengunggah</strong> data apapun ke server.
            </p>
            <p className="text-xs text-amber-400 mt-2">
              ⚠️ Local Storage bukan penyimpanan terenkripsi. Gunakan fitur ekspor untuk backup penting.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border border-red-500/20">
        <h2 className="text-sm font-semibold text-red-400 mb-1">Zona Bahaya</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Tindakan ini tidak dapat dibatalkan</p>

        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 size={16} /> Reset Semua Data
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
            <div className="flex items-start gap-2">
              <Database size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Are you sure?</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Semua dompet, transaksi, budget, dan pengaturan akan dihapus permanen dari browser ini.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)} className="btn-ghost flex-1 text-sm">Batal</button>
              <button onClick={handleReset} className="btn-danger flex-1 text-sm">Ya, Hapus Semua</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryManager() {
  const { store, addCategory, updateCategory, deleteCategory } = useFinance()
  const { success, error } = useToast()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'income' | 'expense'>('expense')
  const [newIcon, setNewIcon] = useState('💸')

  const categories = store?.categories ?? []

  const handleAdd = () => {
    if (!newName.trim()) { error('Nama kategori wajib diisi'); return }
    addCategory({ name: newName.trim(), type: newType, icon: newIcon })
    success('Kategori ditambahkan!')
    setNewName('')
    setAdding(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus kategori "${name}"?`)) {
      deleteCategory(id)
      success('Kategori dihapus')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--hover)] group"
          >
            <span>{cat.icon}</span>
            <span className="text-[var(--text-primary)]">{cat.name}</span>
            <span className={`text-[10px] px-1 rounded ${cat.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
              {cat.type === 'income' ? 'in' : 'out'}
            </span>
            <button
              onClick={() => handleDelete(cat.id, cat.name)}
              className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all"
            >
              <Trash size={11} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            className="form-input w-14 text-center"
            maxLength={2}
            placeholder="🏷️"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="form-input flex-1 min-w-32"
            placeholder="Nama kategori"
            autoFocus
          />
          <select value={newType} onChange={(e) => setNewType(e.target.value as 'income' | 'expense')} className="form-input w-32">
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
          <button onClick={handleAdd} className="btn-primary text-sm px-4">Tambah</button>
          <button onClick={() => setAdding(false)} className="btn-ghost text-sm px-4">Batal</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
          <Plus size={14} /> Tambah Kategori
        </button>
      )}
    </div>
  )
}

function LocalFileManager() {
  const { store, importData: ctxImport } = useFinance()
  const { success, error } = useToast()
  const { connected, name: fileName } = useFileStatus()
  const [mounted, setMounted] = useState(false)
  const [busy, setBusy] = useState(false)
  const supported = mounted && isFileSystemAccessSupported()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async () => {
    if (!store) return
    setBusy(true)
    try {
      await saveToLocalFile(store)
      success('File terhubung, perubahan akan tersimpan otomatis')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      error(e instanceof Error ? e.message : 'Gagal menyimpan file')
    } finally {
      setBusy(false)
    }
  }

  const handleOpen = async () => {
    setBusy(true)
    try {
      const { data, name } = await openLocalFile()
      ctxImport(data)
      success(`Dibuka: ${name}`)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      error(e instanceof Error ? e.message : 'Gagal membuka file')
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async () => {
    await disconnectLocalFile()
    success('Terputus dari file lokal')
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Penyimpanan ke File Lokal</h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Simpan data langsung ke file di drive laptop/pc-mu, seperti aplikasi desktop.
      </p>
      {!supported ? (
        <p className="text-xs text-amber-400">
          ⚠️ Fitur ini hanya didukung di browser Chrome/Edge di desktop.
        </p>
      ) : (
        <>
          {connected && fileName && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 min-w-0">
                <HardDrive size={14} className="shrink-0" />
                <span className="truncate">
                  Tersimpan otomatis ke <strong>{fileName}</strong>
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors shrink-0"
              >
                <Unlink size={12} /> Putuskan
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={busy}
              className="btn-primary flex items-center justify-center gap-2 flex-1"
            >
              <Save size={16} /> {connected ? 'Simpan ke File Lain' : 'Simpan ke File Lokal'}
            </button>
            <button
              onClick={handleOpen}
              disabled={busy}
              className="btn-ghost flex items-center justify-center gap-2 flex-1"
            >
              <FolderOpen size={16} /> Buka dari File Lokal
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Setelah terhubung, setiap perubahan data otomatis ditulis ke file tersebut.
            Data tetap aman walaupun localStorage di-clear atau pindah browser.
          </p>
        </>
      )}
    </div>
  )
}
