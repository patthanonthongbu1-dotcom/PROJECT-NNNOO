'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/artist', label: 'Artist' },
  { href: '/admin/albums', label: 'Albums' },
  { href: '/admin/tracks', label: 'Tracks' },
] as const

/** Top rail of the admin chrome, styled like the site's sidebar nav. */
export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin sections">
      <ul className="flex flex-wrap items-center gap-1">
        {LINKS.map((link) => {
          // `/admin` would otherwise light up on every child route.
          const active =
            link.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(link.href)

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-full px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  active
                    ? 'bg-surface-3 text-ink'
                    : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
