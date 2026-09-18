'use client'

import { useActionState } from 'react'
import { toggleTrackPublished, type ActionState } from '@/lib/actions'
import { useEditMode } from './EditModeProvider'

/**
 * Publish or unpublish a song from the tracklist it sits in.
 *
 * Renders nothing for a reader and nothing outside edit mode, so the album
 * page keeps exactly the shape it has today until the switch is flipped.
 */
export function TrackRowActions({
  trackId,
  published,
}: {
  trackId: string
  published: boolean
}) {
  const { editing } = useEditMode()
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    toggleTrackPublished,
    { status: 'idle' }
  )

  if (!editing) return null

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="id" value={trackId} />
      <button
        type="submit"
        disabled={pending}
        title={state.status === 'error' ? state.message : undefined}
        className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50 ${
          state.status === 'error'
            ? 'border-red-900 text-red-400'
            : published
              ? 'border-line text-ink-muted hover:text-ink'
              : 'border-accent/50 text-accent hover:bg-accent/10'
        }`}
      >
        {pending ? '…' : published ? 'Unpublish' : 'Publish'}
      </button>
    </form>
  )
}
