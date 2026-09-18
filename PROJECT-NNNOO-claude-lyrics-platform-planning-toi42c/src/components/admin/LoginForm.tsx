'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Field, TextInput } from './FormControls'

type Mode = 'password' | 'magic'
type Status = 'idle' | 'working' | 'sent' | 'error'

/**
 * Sign-in for the admin panel, by password or by emailed link.
 *
 * Password is the default because Supabase's built-in mailer allows only a
 * couple of messages an hour on the free tier, so the magic link stops being
 * available exactly when you are retrying and need it most.
 *
 * Both run in the browser rather than through a Server Action: the client
 * has to be the one to store the session, and for the link flow it must also
 * hold the PKCE verifier it will hand back at `/auth/callback`.
 */
export function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function signInWithPassword() {
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'That email and password do not match an account.'
          : signInError.message
      )
      setStatus('error')
      return
    }

    // The session cookie is set client-side, so the server components still
    // hold the signed-out render until the router refetches them.
    router.replace(next ?? '/admin')
    router.refresh()
  }

  async function sendMagicLink() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const callback = new URL('/auth/callback', siteUrl)
    if (next) callback.searchParams.set('next', next)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString() },
    })

    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes('rate limit')
          ? 'Too many emails sent. Wait an hour, or sign in with a password.'
          : signInError.message
      )
      setStatus('error')
      return
    }
    setStatus('sent')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('working')
    setError('')

    if (mode === 'password') await signInWithPassword()
    else await sendMagicLink()
  }

  function switchTo(nextMode: Mode) {
    setMode(nextMode)
    setStatus('idle')
    setError('')
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
          onClick={() => switchTo('password')}
          className="text-sm font-bold text-accent underline-offset-4 hover:underline"
        >
          Use a password instead
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Email"
        htmlFor="email"
        hint="Only the admin account can sign in."
      >
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

      {mode === 'password' && (
        <Field label="Password" htmlFor="password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            invalid={status === 'error'}
          />
        </Field>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={
          status === 'working' || !email || (mode === 'password' && !password)
        }
      >
        {status === 'working'
          ? mode === 'password'
            ? 'Signing in…'
            : 'Sending…'
          : mode === 'password'
            ? 'Sign in'
            : 'Email me a link'}
      </Button>

      <button
        type="button"
        onClick={() => switchTo(mode === 'password' ? 'magic' : 'password')}
        className="text-sm text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        {mode === 'password'
          ? 'Email me a sign-in link instead'
          : 'Sign in with a password instead'}
      </button>
    </form>
  )
}
