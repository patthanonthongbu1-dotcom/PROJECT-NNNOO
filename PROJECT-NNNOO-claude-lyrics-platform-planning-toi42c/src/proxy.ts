import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { hasAuthCookie } from '@/lib/auth-cookie'

/**
 * Refreshes the Supabase session on every matched request and turns away
 * anonymous visitors heading for `/admin`.
 *
 * This guard is deliberately optimistic: it only proves a session cookie is
 * valid, never that the user is an admin (that would mean a database round
 * trip on every navigation). `requireAdmin()` in each page and action makes
 * the real decision.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // `/auth/*` is where the magic link lands, and the login page has to stay
  // reachable while signed out or the redirect below would loop.
  const isPublicAuthRoute =
    pathname === '/admin/login' || pathname.startsWith('/auth/')
  const wantsAdmin = pathname.startsWith('/admin') && !isPublicAuthRoute

  // With no Supabase project configured the site runs on the sample content
  // in demo-data.ts. Creating a client here would throw on the undefined URL,
  // and this matcher covers every page, so the whole site would 500.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return wantsAdmin ? redirectToLogin(request) : NextResponse.next()
  }

  // No session cookie means there is no token to refresh and nobody to
  // recognise, so the round trip to the auth server buys nothing. That is
  // every anonymous request and every `<Link>` prefetch the sidebar fires,
  // which is exactly the call worth not making.
  if (!hasAuthCookie(request.cookies.getAll())) {
    return wantsAdmin ? redirectToLogin(request) : NextResponse.next()
  }

  // The response has to be created up front and handed to `setAll`, because
  // a refreshed access token arrives as Set-Cookie headers on THIS object.
  // Returning a different NextResponse — or recreating it after the Supabase
  // call — drops those headers and the session silently reverts to the old,
  // expired token on the next request.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to the request too, so anything downstream in this same
          // pass reads the new cookies rather than the stale ones.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // Do not remove: this call is what actually performs the token refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Come back to where they were aiming once the magic link lands.
  if (!user && wantsAdmin) return redirectToLogin(request)

  // A signed-in admin has no reason to see the login form. `denied` marks a
  // bounce back from `requireAdmin()` — a signed-in non-admin — and skipping
  // the redirect there is what stops the two guards ping-ponging forever.
  const deniedBounce = request.nextUrl.searchParams.has('denied')
  if (user && pathname === '/admin/login' && !deniedBounce) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

function redirectToLogin(request: NextRequest) {
  const target = request.nextUrl.pathname + request.nextUrl.search
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = ''
  url.searchParams.set('next', target)
  return NextResponse.redirect(url)
}

export const config = {
  // Without a matcher this runs for static assets and image requests too,
  // which would refresh the session dozens of times per page view. The
  // generated OG images and metadata files are in the same category: nobody
  // is signed in to a scraper.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|opengraph-image|sitemap.xml|robots.txt|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|txt|xml|webmanifest)$).*)',
  ],
}
