import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from './supabase/server'
import { isDatabaseConfigured } from './queries'

/**
 * Auth data access for the admin section.
 *
 * Every export is wrapped in React `cache` so a page that calls
 * `requireAdmin()` and then reads the user again only pays for one round
 * trip to Supabase per request.
 */

/**
 * The signed-in user, or null.
 *
 * Uses `getUser()` rather than Supabase's own `getSession()`: the latter
 * trusts whatever the cookie says, while `getUser()` revalidates the JWT
 * against the auth server. On the server the cookie is attacker-supplied
 * input, so only the revalidating call is safe to gate access on.
 */
export const getSession = cache(async (): Promise<User | null> => {
  // Demo mode: there is no auth server to ask, so nobody is signed in and
  // the admin section stays closed rather than crashing on a missing URL.
  if (!isDatabaseConfigured) return null

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
})

export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getSession()
  if (!user) return false

  const supabase = await createClient()
  // RLS on `profiles` only exposes the caller's own row, so this cannot be
  // used to probe anyone else's flag.
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  return data?.is_admin === true
})

/**
 * Gate for every admin page and Server Action.
 *
 * The proxy already redirects anonymous requests, but that check is
 * optimistic — it never reads the database and Server Actions can be POSTed
 * to directly — so the real authorization decision is made here, next to
 * the data.
 */
export const requireAdmin = cache(async (): Promise<User> => {
  const user = await getSession()
  if (!user) redirect('/admin/login')
  if (!(await isAdmin())) redirect('/admin/login?denied=1')
  return user
})
