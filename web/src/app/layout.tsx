import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import './accessibility.css'
import { ErrorBoundary } from '@/components'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Stech AI - Türkçe AI Asistan Platformu',
  description:
    'Restoranlar ve müşteriler için AI-destekli masa rezervasyonu, ön sipariş ve hizmet platformu',
  keywords: ['restaurant', 'reservation', 'AI', 'Turkish', 'food ordering'],
  authors: [{ name: 'Stech AI' }],
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Skip to main content link for keyboard users */}
        <link rel="preload" as="style" href="/globals.css" />
      </head>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Main content&apos;e atla
        </a>
        <ErrorBoundary>
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  )
}
