'use client'

import { useActionState } from 'react'
import {
  deleteAnnotation,
  reanchorAnnotation,
  type ActionState,
} from '@/lib/actions'
import { findDriftedAnnotations, reanchor } from '@/lib/annotations'
import type { Annotation } from '@/lib/database.types'

/**
 * Notes whose offsets no longer land on the words they were written about,
 * because the lyrics were edited underneath them.
 *
 * The reader hides these rather than highlighting the wrong line, so without
 * somewhere to say so they would simply vanish. This is that somewhere, on
 * the page where the damage is visible — the Studio has the same panel for
 * anyone who prefers to work there.
 */
export function DriftedNotes({
  trackId,
  lyrics,
  annotations,
}: {
  trackId: string
  lyrics: string
  annotations: Annotation[]
}) {
  const drifted = findDriftedAnnotations(lyrics, annotations)
  if (drifted.length === 0) return null

  return (
    <section className="mb-6 rounded-card border border-amber-900 bg-amber-950/30 p-4">
      <h2 className="text-sm font-bold text-amber-200">
        {drifted.length} note{drifted.length === 1 ? '' : 's'} came unstuck
      </h2>
      <p className="mt-1 text-xs text-amber-200/80">
        Editing the lyrics shifts every character position after the edit, so
        these no longer cover the words they were written about. They stay
        hidden until they are re-anchored.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {drifted.map((annotation) => (
          <DriftedNote
            key={annotation.id}
            annotation={annotation}
            trackId={trackId}
            lyrics={lyrics}
          />
        ))}
      </ul>
    </section>
  )
}

function DriftedNote({
  annotation,
  trackId,
  lyrics,
}: {
  annotation: Annotation
  trackId: string
  lyrics: string
}) {
  // Mirrors what the action will do, so the offer is only made when it can
  // actually be kept.
  const match = reanchor(lyrics, annotation)
  const occurrences = countOccurrences(lyrics, annotation.quote)

  const [fixState, fixAction, fixing] = useActionState<ActionState, FormData>(
    reanchorAnnotation,
    { status: 'idle' }
  )
  const [, removeAction, removing] = useActionState<ActionState, FormData>(
    deleteAnnotation,
    { status: 'idle' }
  )

  return (
    <li className="rounded border border-amber-900/60 bg-surface p-3">
      <blockquote className="border-l-2 border-amber-400 px-3 py-1 font-mono text-sm whitespace-pre-wrap text-amber-100">
        {annotation.quote}
      </blockquote>
      <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{annotation.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {match ? (
          <>
            <form action={fixAction}>
              <input type="hidden" name="id" value={annotation.id} />
              <input type="hidden" name="track_id" value={trackId} />
              <button
                type="submit"
                disabled={fixing}
                className="rounded-full border border-line bg-surface-2 px-4 py-1.5 text-sm font-bold text-ink transition-colors hover:bg-surface-3 disabled:opacity-50"
              >
                {fixing ? 'Re-anchoring…' : 'Re-anchor'}
              </button>
            </form>
            <span className="text-xs text-ink-faint">
              The words are still there, further along.
            </span>
          </>
        ) : (
          <p className="text-xs text-amber-200/90">
            {occurrences === 0
              ? 'That wording is gone from the lyrics, so there is nothing to point at. Delete it, or restore the line.'
              : `That wording now appears ${occurrences} times. Picking one would silently move the note onto a different line, so it has to be decided by hand.`}
          </p>
        )}

        <form
          action={removeAction}
          onSubmit={(event) => {
            if (!window.confirm('Delete this annotation?')) event.preventDefault()
          }}
        >
          <input type="hidden" name="id" value={annotation.id} />
          <input type="hidden" name="track_id" value={trackId} />
          <button
            type="submit"
            disabled={removing}
            className="text-xs font-bold text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
          >
            {removing ? 'Deleting…' : 'Delete'}
          </button>
        </form>
      </div>

      {fixState.status === 'error' && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {fixState.message}
        </p>
      )}
    </li>
  )
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle === '') return 0
  let count = 0
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    count += 1
    index = haystack.indexOf(needle, index + 1)
  }
  return count
}
