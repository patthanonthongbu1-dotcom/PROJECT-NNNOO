import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cookie-less Supabase client for build-time reads.
 *
 * `generateStaticParams` runs during `next build`, where there is no request
 * and calling `cookies()` is an error. This client carries no session at all,
 * so it sees exactly what an anonymous visitor sees — which is all the slug
 * lists need, since only published rows are readable under RLS anyway.
 */
export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
