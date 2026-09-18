'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArtistIcon, HomeIcon, SearchIcon, StudioIcon } from './icons'

/**
 * The bottom tab bar, which is the entire navigation below `lg`.
 *
 * The sidebar is desktop-only, so until this existed a phone had no way
 * between pages but the back button, and no way into the editor at all.
 *
 * Studio is a tab for everyone rather than a hidden door: an anonymous tap
 * lands on the login screen, which the proxy already arranges, and there is
 * nothing behind it that the login and `requireAdmin()` do not guard.
 */
export function MobileNav({ artistSlug }: { artistSlug: string | null }) {
  const pathname = usePathname()

  const tabs = [
    { href: '/', label: 'Home', icon: HomeIcon, exact: true, quiet: false },
    { href: '/search', label: 'Search', icon: SearchIcon, exact: false, quiet: false },
    ...(artistSlug
      ? [
          {
            href: `/artist/${artistSlug}`,
            label: 'Artist',
            icon: ArtistIcon,
            exact: false,
            quiet: false,
          },
        ]
      : []),
    // `quiet`: for a reader, prefetching the Studio only ever warms the
    // redirect to the login page — on every page they open.
    { href: '/admin', label: 'Studio', icon: StudioIcon, exact: false, quiet: true },
  ]

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="flex items-stretch">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                prefetch={tab.quiet ? false : undefined}
                rel={tab.quiet ? 'nofollow' : undefined}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-[0.6875rem] font-bold transition-colors ${
                  active ? 'text-ink' : 'text-ink-faint hover:text-ink-muted'
                }`}
              >
                <Icon className="size-6" />
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
