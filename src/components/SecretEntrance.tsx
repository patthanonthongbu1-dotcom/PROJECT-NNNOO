'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Two unadvertised ways into the admin panel, so `/admin` need not be linked
 * from anywhere public.
 *
 *   - Type the pass phrase anywhere on the site (desktop).
 *   - Tap the bottom-left corner five times quickly (touch devices, where
 *     there is no keyboard to type it on).
 *
 * This hides the door; it is not a lock. Anyone can still navigate straight
 * to /admin, and what actually stops them getting in is the magic-link login,
 * the is_admin check in every page and action, and the row level security
 * policies behind those. Treat this purely as a convenience.
 */

const PHRASE = (process.env.NEXT_PUBLIC_ADMIN_PHRASE ?? 'studio').toLowerCase()
const TAPS_REQUIRED = 5
const TAP_WINDOW_MS = 2000
const TYPING_RESET_MS = 2000

export function SecretEntrance() {
  const router = useRouter()
  const buffer = useRef('')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const taps = useRef<number[]>([])

  const enter = useCallback(() => {
    buffer.current = ''
    taps.current = []
    router.push('/admin')
  }, [router])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Never swallow real typing: the search box and every admin field
      // would otherwise trip this.
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }

      if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      buffer.current = (buffer.current + event.key.toLowerCase()).slice(
        -PHRASE.length
      )

      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => {
        buffer.current = ''
      }, TYPING_RESET_MS)

      if (buffer.current === PHRASE) enter()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [enter])

  function onCornerTap() {
    const now = Date.now()
    taps.current = [...taps.current, now].filter((t) => now - t < TAP_WINDOW_MS)
    if (taps.current.length >= TAPS_REQUIRED) enter()
  }

  return (
    <button
      type="button"
      onClick={onCornerTap}
      // Deliberately unlabelled and hidden from assistive tech: it is not a
      // control anyone should discover by tabbing or with a screen reader.
      aria-hidden
      tabIndex={-1}
      className="fixed bottom-0 left-0 z-50 size-12 cursor-default opacity-0"
    />
  )
}
