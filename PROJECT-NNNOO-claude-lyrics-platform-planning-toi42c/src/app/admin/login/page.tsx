import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/admin/LoginForm'
import { isDatabaseConfigured } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default async function LoginPage({
  searchParams,
}: PageProps<'/admin/login'>) {
  const params = await searchParams
  const next = typeof params.next === 'string' ? params.next : undefined
  const error = typeof params.error === 'string' ? params.error : undefined
  const denied = params.denied === '1'

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-12">
      <div>
        <h1 className="text-3xl font-black text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The Studio is where songs are created and released.
        </p>
      </div>

      {denied && (
        <p role="alert" className="rounded border border-line bg-surface-2 px-3 py-2 text-sm text-ink-muted">
          That account is signed in but is not an admin.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="rounded-card border border-line bg-surface p-6">
        {/*
          The Studio tab is in the navigation for everyone, so this page is
          reachable on the demo site too — where there is no auth server and
          the sign-in form would throw on the first keystroke.
        */}
        {isDatabaseConfigured ? (
          // Passed through the magic link so the admin lands where they were headed.
          <LoginForm next={next} />
        ) : (
          <div className="flex flex-col gap-3 text-sm text-ink-muted">
            <p className="text-lg font-bold text-ink">Running on sample data</p>
            <p>
              This copy has no Supabase project connected, so there is nothing
              to sign in to. The README has the three environment variables it
              needs.
            </p>
            <Link
              href="/"
              className="font-bold text-accent underline-offset-4 hover:underline"
            >
              Back to the site
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
