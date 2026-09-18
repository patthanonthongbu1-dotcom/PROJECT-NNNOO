/**
 * Supabase stores the session as `sb-<project-ref>-auth-token`, split into
 * `.0`, `.1`… chunks when the JWT outgrows a single cookie.
 *
 * This lives apart from `auth.ts` because that module is `server-only` and
 * the proxy runs outside that boundary — both need to answer the same cheap
 * question: is there any point asking the auth server about this request?
 */
export const AUTH_COOKIE = /^sb-.+-auth-token(\.\d+)?$/

export function hasAuthCookie(cookies: { name: string }[]): boolean {
  return cookies.some((cookie) => AUTH_COOKIE.test(cookie.name))
}
