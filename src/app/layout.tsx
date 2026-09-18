import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-sans-var',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  // Relative OG image paths need an absolute base to resolve against; without
  // it Next falls back to localhost and shared links preview nothing.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'Lyrics',
    template: '%s · Lyrics',
  },
  description: 'Lyrics, credits and liner notes.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
