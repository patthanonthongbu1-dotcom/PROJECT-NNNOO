import Link from 'next/link'
import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'
import { signOut } from '@/lib/actions'

export const metadata: Metadata = {
  title: {
    default: 'Studio',
    template: '%s · Studio',
  },
  robots: { index: false, follow: false },
}

/**
 * Chrome only — there is deliberately no auth check here. A layout does not
 * re-render on navigation between its child routes and cannot stop one from
 * rendering, so a check placed here would be a guard in appearance only. It
 * lives in the proxy and in each page and action instead.
 */
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="min-h-dvh bg-base">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-black tracking-wide text-ink"
            >
              Studio
            </Link>
            <AdminNav />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-bold text-ink-muted transition-colors hover:text-ink"
            >
              View site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  )
}
