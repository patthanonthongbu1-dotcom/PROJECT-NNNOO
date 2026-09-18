import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/LoginForm'

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
          Magic link only — there is no password to lose.
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
        {/* Passed through the magic link so the admin lands where they were headed. */}
        <LoginForm next={next} />
      </div>
    </div>
  )
}
