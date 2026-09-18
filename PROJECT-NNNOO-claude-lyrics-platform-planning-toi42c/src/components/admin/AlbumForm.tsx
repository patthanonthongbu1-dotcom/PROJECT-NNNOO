'use client'

import { useActionState } from 'react'
import { createAlbum, updateAlbum, type ActionState } from '@/lib/actions'
import type { Album } from '@/lib/database.types'
import {
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from './FormControls'
import { ImageUpload } from './ImageUpload'

const ALBUM_TYPES = [
  { value: 'album', label: 'Album' },
  { value: 'ep', label: 'EP' },
  { value: 'single', label: 'Single' },
] as const

export function AlbumForm({ album }: { album?: Album }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    album ? updateAlbum : createAlbum,
    { status: 'idle' }
  )

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {album && <input type="hidden" name="id" value={album.id} />}

      <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
        <TextInput
          id="title"
          name="title"
          required
          defaultValue={album?.title ?? ''}
          invalid={Boolean(state.fieldErrors?.title)}
        />
      </Field>

      {album && (
        <Field
          label="URL slug"
          htmlFor="slug"
          hint="Appears in /album/… — changing it breaks existing links."
          error={state.fieldErrors?.slug}
        >
          <TextInput
            id="slug"
            name="slug"
            defaultValue={album.slug}
            invalid={Boolean(state.fieldErrors?.slug)}
          />
        </Field>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Release date" htmlFor="release_date">
          <TextInput
            id="release_date"
            name="release_date"
            type="date"
            defaultValue={album?.release_date ?? ''}
          />
        </Field>

        <Field label="Type" htmlFor="album_type">
          <Select
            id="album_type"
            name="album_type"
            defaultValue={album?.album_type ?? 'album'}
          >
            {ALBUM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Genres"
        htmlFor="genres"
        hint="Comma separated, e.g. alternative, bedroom pop."
      >
        <TextInput
          id="genres"
          name="genres"
          defaultValue={album?.genres.join(', ') ?? ''}
          placeholder="alternative, bedroom pop"
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <TextArea
          id="description"
          name="description"
          rows={4}
          defaultValue={album?.description ?? ''}
        />
      </Field>

      <ImageUpload
        name="cover_url"
        label="Cover art"
        folder="covers"
        defaultValue={album?.cover_url}
        hint="Square. Shown in the sidebar and on album pages."
      />

      <FormMessage state={state} />

      <div>
        <SubmitButton>{album ? 'Save album' : 'Create album'}</SubmitButton>
      </div>
    </form>
  )
}
