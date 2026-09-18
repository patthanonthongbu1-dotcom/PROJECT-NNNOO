'use client'

import { useActionState } from 'react'
import { createTrack, type ActionState } from '@/lib/actions'
import type { Album } from '@/lib/database.types'
import { Field, FormMessage, Select, SubmitButton, TextInput } from './FormControls'

/** Just enough to get a track into the database; the rest is the editor's job. */
export function NewTrackForm({ albums }: { albums: Album[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createTrack, {
    status: 'idle',
  })

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr]">
        <Field label="Title" htmlFor="new-title" error={state.fieldErrors?.title}>
          <TextInput
            id="new-title"
            name="title"
            required
            invalid={Boolean(state.fieldErrors?.title)}
          />
        </Field>

        <Field label="Album" htmlFor="new-album" error={state.fieldErrors?.album_id}>
          <Select
            id="new-album"
            name="album_id"
            required
            defaultValue={albums[0]?.id ?? ''}
            invalid={Boolean(state.fieldErrors?.album_id)}
          >
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="No."
          htmlFor="new-number"
          error={state.fieldErrors?.track_number}
        >
          <TextInput
            id="new-number"
            name="track_number"
            type="number"
            min={1}
            inputMode="numeric"
            invalid={Boolean(state.fieldErrors?.track_number)}
          />
        </Field>
      </div>

      <FormMessage state={state} />

      <div>
        <SubmitButton pendingLabel="Creating…">Create track</SubmitButton>
      </div>
    </form>
  )
}
