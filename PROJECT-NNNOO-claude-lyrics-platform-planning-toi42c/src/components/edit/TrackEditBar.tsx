'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { toggleTrackPublished, type ActionState } from '@/lib/actions'

/**
 * The strip of controls that appears above a song in edit mode.
 *
 * It holds the two things the page itself cannot express — whether the song
 * is published, and the way through to everything structural — and nothing
 * else. Titles, lyrics, notes and credits are all edited in place, where
 * they are read.
 */
export function TrackEditBar({
  trackId,
  trackTitle,
  published,
}: {
  trackId: string
  trackTitle: string
  published: boolean
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    toggleTrackPublished,
    { status: 'idle' }
  )

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-card border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          published
            ? 'bg-accent/20 text-accent'
            : 'bg-surface-3 text-ink-muted'
        }`}
      >
        {published ? 'Published' : 'Draft'}
      </span>

      <form action={formAction}>
        <input type="hidden" name="id" value={trackId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-line bg-surface-2 px-4 py-1.5 text-sm font-bold text-ink transition-colors hover:bg-surface-3 disabled:opacity-50"
        >
          {pending ? 'Updating…' : published ? 'Unpublish' : 'Publish'}
        </button>
      </form>

      <span className="flex-1" />

      <Link
        href={`/admin/tracks/${trackId}`}
        className="text-sm font-bold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        Open in Studio
      </Link>

      {state.status === 'error' && (
        <p role="alert" className="w-full text-xs text-red-400">
          {state.message}
        </p>
      )}

      <p className="w-full text-xs text-ink-faint">
        Editing “{trackTitle}”. Slug, album, track number and duration live in
        the Studio — changing those is not something to do by accident while
        reading.
      </p>
    </div>
  )
}
