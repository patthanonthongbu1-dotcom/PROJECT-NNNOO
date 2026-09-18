'use client'

import { useState, useTransition } from 'react'
import { patchTrack } from '@/lib/actions'

/**
 * The lyrics themselves, edited where they are read.
 *
 * Open, this replaces the rendered lyrics with a plain textarea — lyrics are
 * plain text with `\n` line breaks, and keeping the editor equally plain is
 * what keeps the offsets an annotation stores meaningful.
 *
 * While it is open, annotating is switched off by the caller: an annotation
 * is anchored to character positions in the *saved* text, and unsaved edits
 * have already moved them.
 */
export function LyricsEditor({
  trackId,
  lyrics,
  open,
  onOpenChange,
  noteCount,
}: {
  trackId: string
  lyrics: string
  open: boolean
  onOpenChange: (open: boolean) => void
  noteCount: number
}) {
  const [draft, setDraft] = useState(lyrics)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // A save revalidates the page, which sends the saved lyrics back down.
  // Taking them during render rather than in an effect means the textarea
  // never shows the old text for a frame first.
  const [savedLyrics, setSavedLyrics] = useState(lyrics)
  if (lyrics !== savedLyrics) {
    setSavedLyrics(lyrics)
    setDraft(lyrics)
  }

  const dirty = draft !== lyrics
  const lineCount = draft === '' ? 0 : draft.split('\n').length
  const wordCount = draft.trim() === '' ? 0 : draft.trim().split(/\s+/).length

  function save() {
    const formData = new FormData()
    formData.set('id', trackId)
    formData.set('lyrics', draft)

    startTransition(async () => {
      const result = await patchTrack({ status: 'idle' }, formData)
      if (result.status === 'error') {
        setError(result.message ?? 'Could not save the lyrics.')
        return
      }
      setError('')
      onOpenChange(false)
    })
  }

  if (!open) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Edit lyrics
        </button>
        <p className="text-xs text-ink-faint">
          Or select any words below to write a note about them.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <label htmlFor="inline-lyrics" className="sr-only">
        Lyrics
      </label>
      <textarea
        id="inline-lyrics"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={24}
        spellCheck
        autoFocus
        placeholder={'[Verse 1]\n'}
        className="w-full rounded border border-accent/50 bg-surface-2 px-3 py-2 font-mono text-sm leading-7 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-2 focus:outline-offset-1 focus:outline-accent"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          {lineCount} lines · {wordCount} words
          {dirty && ' · unsaved'}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(lyrics)
              setError('')
              onOpenChange(false)
            }}
            className="px-2 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save lyrics'}
          </button>
        </div>
      </div>

      {noteCount > 0 && dirty && (
        <p className="text-xs text-amber-200/90">
          Editing the words shifts every character position after the change,
          so notes anchored past it may come unstuck. Any that do are listed
          under the lyrics once this is saved.
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
