'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * The search input. Owns nothing but the query string: every keystroke is
 * debounced into `/search?q=…`, and the page below re-renders from that.
 */
export function SearchBox() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(() => searchParams.get('q') ?? '')

  // Only the first render reads the URL. Syncing it back into the input on
  // every param change would fight the user, since typing is what writes it.
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    const timer = setTimeout(() => {
      const query = value.trim()
      // `replace`, so a five-letter word doesn't leave five history entries.
      router.replace(
        query ? `/search?q=${encodeURIComponent(query)}` : '/search',
        { scroll: false }
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [value, router])

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="site-search" className="sr-only">
        Search lyrics
      </label>
      <div className="relative max-w-xl">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-faint"
        >
          <SearchIcon />
        </span>
        <input
          id="site-search"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What do you want to read?"
          autoComplete="off"
          className="w-full rounded-full border border-line bg-surface py-3 pr-5 pl-12 text-ink transition-colors placeholder:text-ink-faint hover:bg-surface-2 focus:bg-surface-2 focus:outline-2 focus:outline-accent"
        />
      </div>
    </form>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" strokeLinecap="round" />
    </svg>
  )
}
