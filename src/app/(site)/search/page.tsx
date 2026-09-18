import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SearchBox } from '@/components/SearchBox'
import { searchTracks } from '@/lib/queries'
import type { Track } from '@/lib/database.types'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search across every lyric on the site.',
}

/** Characters around the first match to show in an excerpt. */
const EXCERPT_LENGTH = 120

export default async function SearchPage(props: PageProps<'/search'>) {
  const { q } = await props.searchParams
  // `?q=a&q=b` arrives as an array; the last one is what the box last wrote.
  const query = (Array.isArray(q) ? q.at(-1) : q)?.trim() ?? ''

  const tracks = query ? await searchTracks(query) : []
  const matcher = buildMatcher(query)

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-3xl font-black text-ink">Search</h1>

      {/* SearchBox reads the query string, so it renders under a boundary. */}
      <Suspense>
        <SearchBox />
      </Suspense>

      <p aria-live="polite" className="mt-4 min-h-5 text-sm text-ink-faint">
        {query
          ? `${tracks.length} ${tracks.length === 1 ? 'result' : 'results'} for “${query}”`
          : ''}
      </p>

      {!query ? (
        <Prompt />
      ) : tracks.length === 0 ? (
        <NoResults query={query} />
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {tracks.map((track) => (
            <Result key={track.id} track={track} matcher={matcher} />
          ))}
        </ul>
      )}
    </div>
  )
}

function Result({ track, matcher }: { track: Track; matcher: RegExp | null }) {
  const excerpt = buildExcerpt(track.lyrics, matcher)

  return (
    <li>
      <Link
        href={`/lyrics/${track.slug}`}
        className="block rounded-card px-4 py-3 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="block truncate font-medium text-ink">
          <Highlight text={track.title} matcher={matcher} />
        </span>
        {excerpt && (
          <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
            {excerpt.clippedStart && '… '}
            <Highlight text={excerpt.text} matcher={matcher} />
            {excerpt.clippedEnd && ' …'}
          </span>
        )}
      </Link>
    </li>
  )
}

function Prompt() {
  return (
    <div className="mt-8 max-w-xl">
      <h2 className="text-xl font-bold text-ink">Search every lyric</h2>
      <p className="mt-2 text-ink-muted">
        Type a song title or a line you remember — the whole catalogue is
        searched, lyrics included.
      </p>
    </div>
  )
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="mt-8 max-w-xl">
      <h2 className="text-xl font-bold text-ink">No results for “{query}”</h2>
      <p className="mt-2 text-ink-muted">
        Check the spelling, or try fewer and more general words.
      </p>
    </div>
  )
}

/** Splits `text` on the matcher's capture group and marks the odd pieces. */
function Highlight({ text, matcher }: { text: string; matcher: RegExp | null }) {
  if (!matcher) return <>{text}</>

  return (
    <>
      {text.split(matcher).map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded-sm bg-highlight px-0.5 text-highlight-ink"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

/**
 * A regex matching any word of the query, wrapped in one capture group so
 * `String.split` keeps the matches. The user's text goes in verbatim, so
 * every metacharacter is escaped first — `c++` must not throw.
 */
function buildMatcher(query: string): RegExp | null {
  const terms = query
    .split(/\s+/)
    // Quotes are phrase syntax for `websearch_to_tsquery`, not part of a word.
    .map((term) => term.replace(/["']/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(Boolean)

  if (terms.length === 0) return null
  return new RegExp(`(${terms.join('|')})`, 'gi')
}

/** A window of lyrics centred on the first match, trimmed to whole words. */
function buildExcerpt(lyrics: string, matcher: RegExp | null) {
  // Lyrics are line-broken; on one line the excerpt reads as a sentence.
  const body = lyrics.replace(/\s+/g, ' ').trim()
  if (!body) return null

  let match: RegExpExecArray | null = null
  if (matcher) {
    matcher.lastIndex = 0
    match = matcher.exec(body)
  }

  const hitStart = match?.index ?? 0
  const hitEnd = hitStart + (match?.[0].length ?? 0)

  let start = Math.max(
    0,
    Math.min(
      hitStart - Math.floor((EXCERPT_LENGTH - (hitEnd - hitStart)) / 2),
      body.length - EXCERPT_LENGTH
    )
  )
  let end = Math.min(body.length, start + EXCERPT_LENGTH)

  // Snap both ends to a space, never so far that the match falls outside.
  if (start > 0) {
    const space = body.indexOf(' ', start)
    if (space !== -1 && space < hitStart) start = space + 1
  }
  if (end < body.length) {
    const space = body.lastIndexOf(' ', end)
    if (space > hitEnd) end = space
  }

  return {
    text: body.slice(start, end),
    clippedStart: start > 0,
    clippedEnd: end < body.length,
  }
}
