'use client'

import React, { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useToast } from '@/context/ToastContext'
import { validateAmount, validateWallet } from '@/lib/validators'
import { toLocalDateString } from '@/lib/formatters'
import { getAllocationAmount, getWalletBalance } from '@/lib/calculations'
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/lib/formatters'
import { Transaction } from '@/types/finance'
import { AlertCircle, CheckCircle2, Split } from 'lucide-react'

interface TransactionFormProps {
  type: 'income' | 'expense'
  initial?: Partial<Transaction>
  onSuccess: () => void
  onCancel: () => void
}

export default function TransactionForm({ type, initial, onSuccess, onCancel }: TransactionFormProps) {
  const { store, addTransaction, addTransactions, addIncomeWithAllocation, updateTransaction } = useFinance()
  const { success, error } = useToast()

  const [amount, setAmount] = useState(initial?.amount ? formatNumberInput(initial.amount) : '')
  const [date, setDate] = useState(
    initial?.date ? initial.date.split('T')[0] : toLocalDateString()
  )
  const [walletId, setWalletId] = useState(initial?.walletId ?? '')
  const [secondaryWalletId, setSecondaryWalletId] = useState('')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [source, setSource] = useState(initial?.source ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [useAllocation, setUseAllocation] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [manualSplit, setManualSplit] = useState(false)
  const [primaryCustomAmount, setPrimaryCustomAmount] = useState('')

  const wallets = store?.wallets ?? []
  const categories = (store?.categories ?? []).filter((c) => c.type === type)
  const allocationRules = store?.allocationRules ?? []

  const parsedAmount = parseNumberInput(amount)
  const selectedRule = allocationRules.find((r) => r.id === selectedRuleId)

  // Saldo dompet utama
  const selectedWallet = wallets.find((w) => w.id === walletId)
  const primaryBalance = selectedWallet
    ? getWalletBalance(selectedWallet, store?.transactions ?? []) +
      (initial?.id && initial.type === 'expense' && initial.walletId === selectedWallet.id
        ? (initial.amount ?? 0)
        : 0)
    : 0

  const isExpense = type === 'expense'
  // Apakah saldo dompet utama tidak mencukupi (akan minus jika dipaksa)
  const isShortfall = isExpense && !initial?.id && Boolean(walletId) && parsedAmount > primaryBalance
  const isZeroBalance = isExpense && Boolean(walletId) && primaryBalance <= 0

  // Nominal pembayaran dari dompet utama & dompet kedua
  const primaryAmountToUse = isShortfall
    ? Math.max(0, primaryBalance)
    : manualSplit
    ? Math.min(parseNumberInput(primaryCustomAmount) || 0, Math.max(0, primaryBalance))
    : Math.min(parsedAmount, Math.max(0, primaryBalance))

  const remainingShortfall = isShortfall
    ? Math.max(0, parsedAmount - primaryAmountToUse)
    : manualSplit
    ? Math.max(0, parsedAmount - primaryAmountToUse)
    : 0

  const secondaryWallet = wallets.find((w) => w.id === secondaryWalletId)
  const secondaryBalance = secondaryWallet
    ? getWalletBalance(secondaryWallet, store?.transactions ?? [])
    : 0
  const isSecondarySufficient = secondaryWallet ? secondaryBalance >= remainingShortfall : false

  // Cek apakah tombol simpan harus dinonaktifkan
  const isSubmitDisabled =
    isExpense &&
    ((isZeroBalance && !initial?.id) ||
      (isShortfall && (!secondaryWalletId || !isSecondarySufficient)) ||
      (manualSplit && (!secondaryWalletId || !isSecondarySufficient || primaryAmountToUse <= 0)))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amtValidation = validateAmount(parsedAmount)
    if (!amtValidation.valid) { error(amtValidation.error!); return }
    const walletValidation = validateWallet(walletId)
    if (!walletValidation.valid) { error(walletValidation.error!); return }

    // Alokasi otomatis untuk income
    if (type === 'income' && useAllocation && selectedRuleId) {
      if (showPreview) {
        addIncomeWithAllocation(
          { type, amount: parsedAmount, walletId, categoryId: categoryId || undefined, source, note, date: new Date(date).toISOString() },
          selectedRuleId
        )
        success('Pemasukan + alokasi berhasil disimpan!')
        onSuccess()
      } else {
        setShowPreview(true)
      }
      return
    }

    // Validasi Pengeluaran (Expense) agar tidak bisa minus
    if (type === 'expense') {
      if (primaryBalance <= 0 && !initial?.id) {
        error(`Saldo dompet ${selectedWallet?.name ?? ''} habis (${formatCurrency(primaryBalance)}). Dompet tidak boleh minus! Silakan pilih dompet lain.`)
        return
      }

      // Skenario Shortfall (Saldo kurang, split ke dompet kedua)
      if (isShortfall) {
        if (!secondaryWalletId) {
          error(`Saldo ${selectedWallet?.name} tidak mencukupi (Kurang ${formatCurrency(remainingShortfall)}). Pilih dompet sisa agar saldo tidak minus!`)
          return
        }
        if (secondaryWalletId === walletId) {
          error('Dompet sisa harus berbeda dengan dompet utama')
          return
        }
        if (!isSecondarySufficient) {
          error(`Saldo dompet kedua (${secondaryWallet?.name}) tidak mencukupi untuk sisa ${formatCurrency(remainingShortfall)}. Dompet tidak boleh minus!`)
          return
        }

        addTransactions([
          {
            type: 'expense',
            amount: primaryAmountToUse,
            walletId,
            categoryId: categoryId || undefined,
            note: note
              ? `${note} (Split 1/2: ${formatCurrency(primaryAmountToUse)} via ${selectedWallet?.name})`
              : `Split 1/2 dari total ${formatCurrency(parsedAmount)} (${selectedWallet?.name})`,
            date: new Date(date).toISOString(),
          },
          {
            type: 'expense',
            amount: remainingShortfall,
            walletId: secondaryWalletId,
            categoryId: categoryId || undefined,
            note: note
              ? `${note} (Split 2/2 sisa: ${formatCurrency(remainingShortfall)} via ${secondaryWallet?.name})`
              : `Split 2/2 sisa dari total ${formatCurrency(parsedAmount)} (${secondaryWallet?.name})`,
            date: new Date(date).toISOString(),
          },
        ])
        success(`Pengeluaran berhasil dicatat dari 2 dompet (${selectedWallet?.name} & ${secondaryWallet?.name})!`)
        onSuccess()
        return
      }

      // Skenario Manual Split
      if (manualSplit && secondaryWalletId) {
        if (secondaryWalletId === walletId) {
          error('Dompet sisa harus berbeda dengan dompet utama')
          return
        }
        if (primaryAmountToUse <= 0 || remainingShortfall <= 0) {
          error('Nominal pada masing-masing dompet harus lebih dari 0')
          return
        }
        if (primaryAmountToUse > primaryBalance) {
          error(`Nominal dari ${selectedWallet?.name} melebihi saldo yang tersedia`)
          return
        }
        if (!isSecondarySufficient) {
          error(`Saldo ${secondaryWallet?.name} tidak mencukupi untuk sisa ${formatCurrency(remainingShortfall)}. Dompet tidak boleh minus!`)
          return
        }

        addTransactions([
          {
            type: 'expense',
            amount: primaryAmountToUse,
            walletId,
            categoryId: categoryId || undefined,
            note: note
              ? `${note} (Split 1/2: ${formatCurrency(primaryAmountToUse)} via ${selectedWallet?.name})`
              : `Split 1/2 (${selectedWallet?.name})`,
            date: new Date(date).toISOString(),
          },
          {
            type: 'expense',
            amount: remainingShortfall,
            walletId: secondaryWalletId,
            categoryId: categoryId || undefined,
            note: note
              ? `${note} (Split 2/2: ${formatCurrency(remainingShortfall)} via ${secondaryWallet?.name})`
              : `Split 2/2 (${secondaryWallet?.name})`,
            date: new Date(date).toISOString(),
          },
        ])
        success(`Pengeluaran berhasil dicatat dari 2 dompet!`)
        onSuccess()
        return
      }

      // Skenario Normal & Edit: Cegah minus
      if (parsedAmount > primaryBalance) {
        error(`Saldo dompet tidak mencukupi (Saldo: ${formatCurrency(primaryBalance)}). Dompet tidak boleh minus!`)
        return
      }
    }

    if (initial?.id) {
      updateTransaction(initial.id, { amount: parsedAmount, walletId, categoryId: categoryId || undefined, source, note, date: new Date(date).toISOString() })
      success('Transaksi diperbarui!')
    } else {
      addTransaction({ type, amount: parsedAmount, walletId, categoryId: categoryId || undefined, source, note, date: new Date(date).toISOString() })
      success(type === 'income' ? 'Pemasukan ditambahkan!' : 'Pengeluaran ditambahkan!')
    }
    onSuccess()
  }

  if (showPreview && selectedRule) {
    const walletName = wallets.find(w => w.id === walletId)?.name ?? '-'
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-[var(--hover)] text-center">
          <p className="text-xs text-[var(--text-muted)] mb-1">Pemasukan</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(parsedAmount)}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">ke {walletName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Alokasi: {selectedRule.name}</p>
          <div className="space-y-2">
            {selectedRule.allocations.map((alloc, i) => {
              const allocAmt = getAllocationAmount(parsedAmount, alloc.percentage)
              const target = wallets.find(w => w.id === alloc.targetId)
              return (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--hover)]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{alloc.label ?? target?.name ?? alloc.targetId}</p>
                    <p className="text-xs text-[var(--text-muted)]">{alloc.percentage}%</p>
                  </div>
                  <p className="font-semibold text-violet-400 tabular-nums shrink-0">{formatCurrency(allocAmt)}</p>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between p-3 mt-2 rounded-xl border border-violet-500/30 bg-violet-500/10">
            <p className="text-sm font-bold text-[var(--text-primary)]">Total</p>
            <p className="font-bold text-violet-400 tabular-nums">{formatCurrency(parsedAmount)}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setShowPreview(false)} className="btn-ghost flex-1">Kembali</button>
          <button type="button" onClick={handleSubmit} className="btn-primary flex-1">Konfirmasi</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="form-label">Nominal</label>
        <input
          type="text"
          inputMode="numeric"
          className="form-input"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(formatNumberInput(e.target.value))}
          required
        />
      </div>

      {/* Wallet */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="form-label mb-0">Dompet</label>
          {selectedWallet && (
            <span className={`text-xs ${primaryBalance <= 0 ? 'text-red-400 font-semibold' : 'text-[var(--text-muted)]'}`}>
              Saldo: <strong className={primaryBalance <= 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}>{formatCurrency(primaryBalance)}</strong>
            </span>
          )}
        </div>
        <select
          className={`form-input ${isZeroBalance ? 'border-red-500/50 focus:border-red-500' : ''}`}
          value={walletId}
          onChange={(e) => {
            setWalletId(e.target.value)
            setSecondaryWalletId('')
          }}
          required
        >
          <option value="">Pilih dompet</option>
          {wallets.map((w) => {
            const bal = getWalletBalance(w, store?.transactions ?? [])
            return (
              <option key={w.id} value={w.id}>
                {w.icon} {w.name} ({formatCurrency(bal)})
              </option>
            )
          })}
        </select>

        {/* Info jika saldo dompet utama 0 / kosong */}
        {isZeroBalance && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
            <AlertCircle size={13} />
            Saldo dompet ini kosong/minus. Silakan pilih dompet lain yang memiliki saldo.
          </p>
        )}

        {/* Info jika saldo mencukupi */}
        {isExpense && selectedWallet && primaryBalance > 0 && !isShortfall && parsedAmount > 0 && (
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 size={13} />
            Saldo mencukupi. Sisa saldo setelah transaksi: {formatCurrency(primaryBalance - parsedAmount)}
          </p>
        )}
      </div>

      {/* Section Split Dompet Otomatis Saat Saldo Kurang (Shortfall) */}
      {isShortfall && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-start gap-2.5 text-amber-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-amber-300 text-sm">
                Saldo Tidak Mencukupi (Cegah Saldo Minus)
              </p>
              <p className="text-[var(--text-muted)]">
                Saldo di <strong className="text-amber-200">{selectedWallet?.name}</strong> hanya{' '}
                <strong className="text-amber-200">{formatCurrency(primaryBalance)}</strong>, sedangkan nominal pengeluaran{' '}
                <strong className="text-[var(--text-primary)]">{formatCurrency(parsedAmount)}</strong>.
              </p>
              <p className="text-amber-300 font-medium">
                Pilih dompet untuk menutupi sisa kekurangan{' '}
                <span className="underline font-bold text-amber-200">{formatCurrency(remainingShortfall)}</span>:
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
              Dompet Sisa Pembayaran
            </label>
            <select
              className="form-input"
              value={secondaryWalletId}
              onChange={(e) => setSecondaryWalletId(e.target.value)}
              required
            >
              <option value="">-- Pilih dompet untuk sisa uang --</option>
              {wallets
                .filter((w) => w.id !== walletId)
                .map((w) => {
                  const bal = getWalletBalance(w, store?.transactions ?? [])
                  const isEnough = bal >= remainingShortfall
                  return (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name} · Saldo: {formatCurrency(bal)} {isEnough ? '(Cukup)' : '(Kurang)'}
                    </option>
                  )
                })}
            </select>
          </div>

          {secondaryWallet && (
            <div
              className={`p-2.5 rounded-lg text-xs ${
                isSecondarySufficient
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {isSecondarySufficient ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CheckCircle2 size={14} />
                    <span>Saldo Cukup! Rincian Pembagian Transaksi:</span>
                  </div>
                  <p>
                    • <strong>{selectedWallet?.name}</strong>: {formatCurrency(primaryAmountToUse)}{' '}
                    <span className="text-[var(--text-muted)]">(Saldo akhir: Rp 0)</span>
                  </p>
                  <p>
                    • <strong>{secondaryWallet?.name}</strong>: {formatCurrency(remainingShortfall)}{' '}
                    <span className="text-[var(--text-muted)]">
                      (Sisa saldo: {formatCurrency(secondaryBalance - remainingShortfall)})
                    </span>
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-1.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Saldo <strong>{secondaryWallet.name}</strong> ({formatCurrency(secondaryBalance)}) juga tidak mencukupi untuk sisa kekurangan {formatCurrency(remainingShortfall)}. Dompet tidak boleh minus. Silakan pilih dompet lain yang memiliki saldo cukup.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Split Toggle (Opsional jika saldo dompet utama cukup tapi user ingin membagi) */}
      {isExpense && !initial?.id && !isShortfall && primaryBalance >= parsedAmount && parsedAmount > 0 && wallets.length > 1 && (
        <div className="pt-1">
          {!manualSplit ? (
            <button
              type="button"
              onClick={() => {
                setManualSplit(true)
                setPrimaryCustomAmount(formatNumberInput(Math.floor(parsedAmount / 2)))
              }}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Split size={13} />
              Bagi pembayaran dengan 2 dompet berbeda?
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                  <Split size={14} />
                  Bagi Pembayaran (Split Dompet)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setManualSplit(false)
                    setSecondaryWalletId('')
                  }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Batal Bagi
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                  Nominal dari {selectedWallet?.name ?? 'Dompet Utama'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  value={primaryCustomAmount}
                  onChange={(e) => setPrimaryCustomAmount(formatNumberInput(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                  Dompet Kedua (Sisa: {formatCurrency(remainingShortfall)})
                </label>
                <select
                  className="form-input"
                  value={secondaryWalletId}
                  onChange={(e) => setSecondaryWalletId(e.target.value)}
                >
                  <option value="">Pilih dompet kedua</option>
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => {
                      const bal = getWalletBalance(w, store?.transactions ?? [])
                      return (
                        <option key={w.id} value={w.id}>
                          {w.icon} {w.name} ({formatCurrency(bal)})
                        </option>
                      )
                    })}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category */}
      <div>
        <label className="form-label">Kategori</label>
        <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Pilih kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Source (income only) */}
      {type === 'income' && (
        <div>
          <label className="form-label">Sumber</label>
          <input
            type="text"
            className="form-input"
            placeholder="Contoh: Project Website"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
      )}

      {/* Date */}
      <div>
        <label className="form-label">Tanggal</label>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Note */}
      <div>
        <label className="form-label">Catatan</label>
        <textarea
          className="form-input resize-none"
          rows={2}
          placeholder="Catatan opsional..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Allocation (income only) */}
      {type === 'income' && allocationRules.length > 0 && (
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-violet-500"
              checked={useAllocation}
              onChange={(e) => setUseAllocation(e.target.checked)}
            />
            <span className="text-sm font-medium text-violet-300">Gunakan Alokasi Otomatis</span>
          </label>
          {useAllocation && (
            <select className="form-input" value={selectedRuleId} onChange={(e) => setSelectedRuleId(e.target.value)}>
              <option value="">Pilih aturan alokasi</option>
              {allocationRules.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {type === 'income' && useAllocation && selectedRuleId
            ? 'Preview'
            : isShortfall && secondaryWalletId && isSecondarySufficient
            ? 'Simpan (Bagi 2 Dompet)'
            : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
