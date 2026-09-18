'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Field, TextInput } from './FormControls'

/**
 * Magic-link sign-in.
 *
 * The OTP request runs in the browser rather than through a Server Action so
 * Supabase issues and stores the PKCE verifier on the same client that will
 * later hand the code back at `/auth/callback`.
 */
export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  )
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setError('')

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const callback = new URL('/auth/callback', siteUrl)
    if (next) callback.searchParams.set('next', next)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString() },
    })

    if (signInError) {
      setError(signInError.message)
      setStatus('error')
      return
    }
    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div role="status" className="flex flex-col gap-3 text-center">
        <p className="text-lg font-bold text-ink">Check your email</p>
        <p className="text-sm text-ink-muted">
          A sign-in link is on its way to{' '}
          <span className="text-ink">{email}</span>. It expires in an hour and
          only works once.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="text-sm font-bold text-accent underline-offset-4 hover:underline"
        >
          Use a different address
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Email" htmlFor="email" hint="Only the admin account can sign in.">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          invalid={status === 'error'}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" disabled={status === 'sending' || !email}>
        {status === 'sending' ? 'Sending…' : 'Email me a link'}
      </Button>
    </form>
  )
}
