import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Reads the session from cookies so RLS sees the signed-in user. Server
 * Components cannot set cookies, so the setAll writes are allowed to throw
 * and are swallowed — session refresh happens in the proxy instead.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component. Safe to ignore.
          }
        },
      },
    }
  )
}
