import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AdChad — your ads are bad. we fix them.',
  description: 'An AI ad agency that roasts weak Meta ads in public, then sells you the fix.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
