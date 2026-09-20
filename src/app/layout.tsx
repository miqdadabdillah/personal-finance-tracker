import type { Metadata } from 'next'
import './globals.css'
import { FinanceProvider } from '@/context/FinanceContext'
import { ToastProvider } from '@/context/ToastContext'
import AppLayout from '@/components/layout/AppLayout'
import ThemeSetter from '@/components/layout/ThemeSetter'
import { FilePersistNotifier } from '@/components/layout/FilePersistNotifier'

export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Catat pemasukan, pengeluaran, kelola budget dan dompet dengan mudah. Semua data tersimpan lokal di browser.',
  keywords: 'finance tracker, keuangan pribadi, budget, dompet, tabungan',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <FinanceProvider>
          <ThemeSetter />
          <ToastProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <FilePersistNotifier />
          </ToastProvider>
        </FinanceProvider>
      </body>
    </html>
  )
}
