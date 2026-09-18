'use client'

import { useActionState, useEffect } from 'react'
import {
  createAnnotation,
  deleteAnnotation,
  reanchorAnnotation,
  type ActionState,
} from '@/lib/actions'
import type { Annotation } from '@/lib/database.types'
import { findDriftedAnnotations, isAnchored, reanchor } from '@/lib/annotations'
import { ActionButton } from './ActionButton'
import { Button, Field, FormMessage, SubmitButton, TextArea } from './FormControls'

export interface Selection {
  start: number
  end: number
  quote: string
}

export function AnnotationEditor({
  trackId,
  savedLyrics,
  annotations,
  selection,
  lyricsDirty,
  onClearSelection,
}: {
  trackId: string
  /** The lyrics as stored, which is what the offsets are measured against. */
  savedLyrics: string
  annotations: Annotation[]
  selection: Selection | null
  lyricsDirty: boolean
  onClearSelection: () => void
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createAnnotation,
    { status: 'idle' }
  )

  useEffect(() => {
    if (state.status === 'success') onClearSelection()
  }, [state, onClearSelection])

  const drifted = findDriftedAnnotations(savedLyrics, annotations)
  const anchored = annotations
    .filter((annotation) => isAnchored(savedLyrics, annotation))
    .sort((a, b) => a.start_offset - b.start_offset)

  return (
    <div className="flex flex-col gap-6">
      {drifted.length > 0 && (
        <DriftPanel
          trackId={trackId}
          savedLyrics={savedLyrics}
          drifted={drifted}
        />
      )}

      {selection ? (
        <form
          action={formAction}
          className="flex flex-col gap-4 rounded border border-accent/40 bg-accent/5 p-4"
        >
          <input type="hidden" name="track_id" value={trackId} />
          <input type="hidden" name="start_offset" value={selection.start} />
          <input type="hidden" name="end_offset" value={selection.end} />
          <input type="hidden" name="quote" value={selection.quote} />

          <div>
            <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
              Annotating
            </p>
            <blockquote className="mt-1 border-l-2 border-highlight-ink bg-highlight/40 px-3 py-2 font-mono text-sm whitespace-pre-wrap text-highlight-ink">
              {selection.quote}
            </blockquote>
            <p className="mt-1 text-xs text-ink-faint">
              Characters {selection.start}–{selection.end}.
            </p>
          </div>

          <Field
            label="Annotation"
            htmlFor="annotation-body"
            error={state.fieldErrors?.body}
          >
            <TextArea
              id="annotation-body"
              name="body"
              rows={5}
              required
              autoFocus
              placeholder="What does this line mean, refer to, or sample?"
              invalid={Boolean(state.fieldErrors?.body)}
            />
          </Field>

          <FormMessage state={state} />

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingLabel="Saving…">Save annotation</SubmitButton>
            <Button type="button" variant="ghost" onClick={onClearSelection}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-ink-faint">
          {lyricsDirty
            ? 'Save the lyrics first — offsets are measured against the stored text.'
            : 'Select words in the lyrics above, then press Annotate.'}
        </p>
      )}

      {anchored.length === 0 ? (
        <p className="text-sm text-ink-faint">No annotations on this track yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {anchored.map((annotation) => (
            <li
              key={annotation.id}
              className="rounded border border-line bg-surface-2 p-4"
            >
              <blockquote className="border-l-2 border-highlight-ink bg-highlight/40 px-3 py-1.5 font-mono text-sm whitespace-pre-wrap text-highlight-ink">
                {annotation.quote}
              </blockquote>
              <p className="mt-3 text-sm whitespace-pre-wrap text-ink-muted">
                {annotation.body}
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-xs text-ink-faint">
                  Characters {annotation.start_offset}–{annotation.end_offset}
                </span>
                <ActionButton
                  action={deleteAnnotation}
                  fields={{ id: annotation.id, track_id: trackId }}
                  variant="ghost"
                  pendingLabel="Deleting…"
                  confirm="Delete this annotation?"
                >
                  Delete
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Annotations whose offsets no longer land on their quote, because the lyrics
 * were edited after they were written. The reader hides these rather than
 * highlighting the wrong words, so they are invisible until fixed here.
 */
function DriftPanel({
  trackId,
  savedLyrics,
  drifted,
}: {
  trackId: string
  savedLyrics: string
  drifted: Annotation[]
}) {
  return (
    <section className="rounded border border-amber-900 bg-amber-950/30 p-4">
      <h3 className="text-sm font-bold text-amber-200">
        {drifted.length} annotation{drifted.length === 1 ? '' : 's'} came unstuck
      </h3>
      <p className="mt-1 text-xs text-amber-200/80">
        Editing the lyrics shifts every character position after the edit, so
        these no longer cover the words they were written about. They stay
        hidden on the public page until they are re-anchored.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {drifted.map((annotation) => {
          // Mirrors what the action will do, so the UI can say up front
          // whether the fix is available.
          const match = reanchor(savedLyrics, annotation)
          const occurrences = countOccurrences(savedLyrics, annotation.quote)

          return (
            <li
              key={annotation.id}
              className="rounded border border-amber-900/60 bg-surface p-3"
            >
              <blockquote className="border-l-2 border-amber-400 px-3 py-1 font-mono text-sm whitespace-pre-wrap text-amber-100">
                {annotation.quote}
              </blockquote>
              <p className="mt-2 line-clamp-2 text-xs text-ink-muted">
                {annotation.body}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {match ? (
                  <>
                    <ActionButton
                      action={reanchorAnnotation}
                      fields={{ id: annotation.id, track_id: trackId }}
                      variant="secondary"
                      pendingLabel="Re-anchoring…"
                    >
                      Re-anchor
                    </ActionButton>
                    <span className="text-xs text-ink-faint">
                      Moves to characters {match.start_offset}–{match.end_offset}.
                    </span>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-amber-200/90">
                      {occurrences === 0
                        ? 'That wording is gone from the lyrics, so there is nothing to point at. Delete it, or restore the line.'
                        : `That wording now appears ${occurrences} times. Picking one would silently move the note onto a different line, so it has to be decided by hand — make the surrounding lines distinct, or delete and rewrite the annotation.`}
                    </p>
                    <ActionButton
                      action={deleteAnnotation}
                      fields={{ id: annotation.id, track_id: trackId }}
                      variant="ghost"
                      pendingLabel="Deleting…"
                      confirm="Delete this annotation?"
                    >
                      Delete
                    </ActionButton>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
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
