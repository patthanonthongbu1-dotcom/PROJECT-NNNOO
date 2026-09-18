import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Magic-link landing strip.
 *
 * Supabase sends the browser here with a one-time `code`; exchanging it is
 * what writes the session cookies. This has to be a Route Handler rather
 * than a page because only handlers (and actions) are allowed to set
 * cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  // Only relative paths, so a crafted link can't bounce the user off-site
  // with a fresh session in hand.
  const destination = next?.startsWith('/') ? next : '/admin'

  if (!code) {
    const description = searchParams.get('error_description') ?? 'Missing code'
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(description)}`
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
