import type { Metadata } from 'next'
import { Anton, Archivo_Black, Bungee, Permanent_Marker, Space_Mono, DM_Sans } from 'next/font/google'
import './globals.css'

// The brand's display fonts → CSS vars (consumed in globals.css + inline styles).
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' })
const archivo = Archivo_Black({ weight: '400', subsets: ['latin'], variable: '--font-archivo', display: 'swap' })
const bungee = Bungee({ weight: '400', subsets: ['latin'], variable: '--font-bungee', display: 'swap' })
const marker = Permanent_Marker({ weight: '400', subsets: ['latin'], variable: '--font-marker', display: 'swap' })
const mono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-mono', display: 'swap' })
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

const SITE_URL = 'https://adchad.ai'
const TITLE = 'AdChad — your ads are bad. we fix them.'
const DESCRIPTION = 'An AI ad agency that roasts weak Meta ads in public, then sells you the fix.'
// The roast-reel thumbnail (public/og.jpg) is the share preview for the whole site.
const OG_IMAGE = { url: '/og.jpg', width: 1920, height: 1080, alt: 'AdChad roasting bad ads at his chalkboard' }

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'AdChad',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@adchadofficial',
    creator: '@adchadofficial',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fonts = [anton, archivo, bungee, marker, mono, sans].map((f) => f.variable).join(' ')
  return (
    <html lang="en" className={fonts}>
      <body>{children}</body>
    </html>
  )
}
