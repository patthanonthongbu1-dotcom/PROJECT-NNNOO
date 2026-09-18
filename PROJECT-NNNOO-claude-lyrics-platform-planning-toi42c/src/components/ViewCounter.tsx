'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Bumps a track's view counter once, from the browser, and renders nothing.
 *
 * Counting here rather than with `recordView` in the server component is what
 * lets the lyrics page stay statically rendered: the render itself does no
 * request-time work, and the count happens after hydration instead.
 */
export function ViewCounter({ slug }: { slug: string }) {
  const counted = useRef(false)

  useEffect(() => {
    // Strict Mode runs effects twice in development; one visit is one view.
    if (counted.current) return
    counted.current = true

    void (async () => {
      try {
        await createClient().rpc('increment_view_count', { track_slug: slug })
      } catch {
        // A lost view is never worth breaking the page for.
      }
    })()
  }, [slug])

  return null
}
