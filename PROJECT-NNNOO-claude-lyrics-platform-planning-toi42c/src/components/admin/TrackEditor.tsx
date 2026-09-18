'use client'

import { useActionState, useCallback, useRef, useState } from 'react'
import { updateTrack, type ActionState } from '@/lib/actions'
import type { Album, Annotation, Credit, Track } from '@/lib/database.types'
import { formatDuration } from '@/lib/format'
import { AnnotationEditor, type Selection } from './AnnotationEditor'
import { CreditsEditor } from './CreditsEditor'
import {
  Button,
  Checkbox,
  Field,
  FormMessage,
  Panel,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from './FormControls'

/**
 * The lyrics editor and everything hanging off it.
 *
 * Track details, credits and annotations are three sibling forms rather than
 * one: HTML forms cannot nest, and each maps to a different action. They
 * share this component only so the annotation composer can read the
 * selection out of the lyrics textarea.
 */
export function TrackEditor({
  track,
  albums,
  credits,
  annotations,
}: {
  track: Track
  albums: Album[]
  credits: Credit[]
  annotations: Annotation[]
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateTrack, {
    status: 'idle',
  })

  const lyricsRef = useRef<HTMLTextAreaElement>(null)
  const [lyrics, setLyrics] = useState(track.lyrics)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [selectionError, setSelectionError] = useState('')

  // Offsets only mean something against the saved text, so annotating is
  // blocked while the textarea is ahead of the database.
  const lyricsDirty = lyrics !== track.lyrics

  const clearSelection = useCallback(() => setSelection(null), [])

  function captureSelection() {
    const textarea = lyricsRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (end <= start) {
      setSelectionError('Highlight the words you want to annotate first.')
      setSelection(null)
      return
    }

    setSelectionError('')
    setSelection({ start, end, quote: lyrics.slice(start, end) })
  }

  const lineCount = lyrics === '' ? 0 : lyrics.split('\n').length
  const wordCount = lyrics.trim() === '' ? 0 : lyrics.trim().split(/\s+/).length

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
        <input type="hidden" name="id" value={track.id} />

        <Panel title="Details">
          <div className="flex flex-col gap-6">
            <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
              <TextInput
                id="title"
                name="title"
                required
                defaultValue={track.title}
                invalid={Boolean(state.fieldErrors?.title)}
              />
            </Field>

            <Field
              label="URL slug"
              htmlFor="slug"
              hint="Appears in /lyrics/… — changing it breaks existing links."
              error={state.fieldErrors?.slug}
            >
              <TextInput
                id="slug"
                name="slug"
                defaultValue={track.slug}
                invalid={Boolean(state.fieldErrors?.slug)}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-[2fr_1fr_1fr]">
              <Field label="Album" htmlFor="album_id">
                <Select
                  id="album_id"
                  name="album_id"
                  defaultValue={track.album_id}
                  required
                >
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Track no."
                htmlFor="track_number"
                error={state.fieldErrors?.track_number}
              >
                <TextInput
                  id="track_number"
                  name="track_number"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  defaultValue={track.track_number ?? ''}
                  invalid={Boolean(state.fieldErrors?.track_number)}
                />
              </Field>

              <Field
                label="Duration"
                htmlFor="duration"
                hint="m:ss or seconds"
                error={state.fieldErrors?.duration}
              >
                <TextInput
                  id="duration"
                  name="duration"
                  defaultValue={
                    track.duration_seconds == null
                      ? ''
                      : formatDuration(track.duration_seconds)
                  }
                  placeholder="3:34"
                  invalid={Boolean(state.fieldErrors?.duration)}
                />
              </Field>
            </div>

            <Checkbox
              id="published"
              name="published"
              label="Published"
              hint="Unpublished tracks are invisible to everyone but you."
              defaultChecked={track.published}
            />

            <Field
              label="About"
              htmlFor="about"
              hint="The note above the lyrics — context, not commentary on a line."
            >
              <TextArea id="about" name="about" rows={4} defaultValue={track.about ?? ''} />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Lyrics"
          description="Plain text. Section headers like [Chorus] are styled on the public page."
        >
          <div className="flex flex-col gap-3">
            <label htmlFor="lyrics" className="sr-only">
              Lyrics
            </label>
            <TextArea
              id="lyrics"
              name="lyrics"
              ref={lyricsRef}
              rows={24}
              spellCheck
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              onSelect={() => setSelectionError('')}
              className="font-mono text-sm leading-7"
              placeholder={'[Verse 1]\n'}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-faint">
                {lineCount} lines · {wordCount} words
                {lyricsDirty && ' · unsaved changes'}
              </p>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={captureSelection}
                  disabled={lyricsDirty}
                  aria-describedby={lyricsDirty ? 'annotate-blocked' : undefined}
                >
                  Annotate selection
                </Button>
              </div>
            </div>

            {lyricsDirty && (
              <p id="annotate-blocked" className="text-xs text-amber-200/90">
                Save the lyrics before annotating — an annotation stores
                character positions, and unsaved edits have already moved them.
              </p>
            )}

            {selectionError && (
              <p role="alert" className="text-xs text-red-400">
                {selectionError}
              </p>
            )}
          </div>
        </Panel>

        <FormMessage state={state} />

        <div className="sticky bottom-4 flex justify-end">
          <SubmitButton>Save track</SubmitButton>
        </div>
      </form>

      <Panel
        title="Annotations"
        description="Genius-style notes pinned to a span of the lyrics."
      >
        <AnnotationEditor
          trackId={track.id}
          savedLyrics={track.lyrics}
          annotations={annotations}
          selection={selection}
          lyricsDirty={lyricsDirty}
          onClearSelection={clearSelection}
        />
      </Panel>

      <Panel title="Credits" description="Who wrote, produced and finished it.">
        <CreditsEditor trackId={track.id} credits={credits} />
      </Panel>
    </div>
  )
}
