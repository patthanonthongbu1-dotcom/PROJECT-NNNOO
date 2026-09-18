import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for Client Components.
 *
 * Uses the anon key, which is public by design — every table is guarded by
 * row level security, so this key can only read published rows and can only
 * write when the signed-in user is flagged as an admin.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
