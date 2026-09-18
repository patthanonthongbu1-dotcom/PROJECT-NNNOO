'use client'

import { useState } from 'react'
import type { Annotation } from '@/lib/database.types'
import { isSectionHeader, segmentLyrics } from '@/lib/annotations'

/**
 * Renders lyrics with annotated spans highlighted. Clicking a span opens its
 * explanation in a panel below the lyrics on narrow screens, or beside them
 * on wide ones — the layout decides where; this just tracks which is open.
 */
export function LyricsView({
  lyrics,
  annotations,
}: {
  lyrics: string
  annotations: Annotation[]
}) {
  const [active, setActive] = useState<Annotation | null>(null)
  const segments = segmentLyrics(lyrics, annotations)

  if (!lyrics.trim()) {
    return <p className="text-ink-faint">No lyrics yet.</p>
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="text-lg leading-relaxed whitespace-pre-wrap">
        {segments.map((segment, i) =>
          segment.annotation ? (
            <button
              key={i}
              type="button"
              onClick={() =>
                setActive((current) =>
                  current?.id === segment.annotation!.id ? null : segment.annotation
                )
              }
              aria-expanded={active?.id === segment.annotation.id}
              className={`cursor-pointer rounded-sm text-left underline decoration-highlight-ink decoration-2 underline-offset-4 transition-colors ${
                active?.id === segment.annotation.id
                  ? 'bg-highlight text-highlight-ink'
                  : 'hover:bg-highlight'
              }`}
            >
              {renderLines(segment.text)}
            </button>
          ) : (
            <span key={i}>{renderLines(segment.text)}</span>
          )
        )}
      </div>

      <aside
        className="lg:sticky lg:top-6"
        aria-live="polite"
        aria-label="Annotation"
      >
        {active ? (
          <div className="rounded-card border border-line bg-surface p-4">
            <blockquote className="border-l-2 border-highlight-ink pl-3 text-sm whitespace-pre-wrap text-ink-muted italic">
              {active.quote}
            </blockquote>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-ink">
              {active.body}
            </p>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="mt-4 text-xs font-bold text-ink-faint transition-colors hover:text-ink"
            >
              Close
            </button>
          </div>
        ) : annotations.length > 0 ? (
          <p className="rounded-card border border-dashed border-line p-4 text-sm text-ink-faint">
            Highlighted lines have notes. Tap one to read it.
          </p>
        ) : null}
      </aside>
    </div>
  )
}

/**
 * Section markers like `[Chorus]` are styled apart from the lyric body. The
 * text is already inside a `whitespace-pre-wrap` block, so the line breaks
 * between them have to be preserved explicitly.
 */
function renderLines(text: string) {
  return text.split('\n').map((line, i, all) => (
    <span key={i}>
      {isSectionHeader(line) ? (
        <span className="font-bold text-ink-muted">{line}</span>
      ) : (
        line
      )}
      {i < all.length - 1 && '\n'}
    </span>
  ))
}
