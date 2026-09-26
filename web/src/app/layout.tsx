import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

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
  viewport: 'width=device-width, initial-scale=1.0',
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
      <body>{children}</body>
    </html>
  )
}
