import type { Metadata, Viewport } from 'next'
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

export const viewport: Viewport = {
  // `cover` is what gives `env(safe-area-inset-*)` a non-zero value, which is
  // what keeps the mobile tab bar clear of the home indicator. The theme
  // colour stops the browser chrome rendering light above a black site.
  viewportFit: 'cover',
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
