import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BazarLine Admin',
  description: 'Админ панель',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk">
      <body>{children}</body>
    </html>
  )
}
