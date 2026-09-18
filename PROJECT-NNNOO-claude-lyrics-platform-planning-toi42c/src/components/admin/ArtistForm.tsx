'use client'

import { useActionState } from 'react'
import { saveArtist, type ActionState } from '@/lib/actions'
import type { Artist } from '@/lib/database.types'
import {
  Field,
  FormMessage,
  SubmitButton,
  TextArea,
  TextInput,
} from './FormControls'
import { ImageUpload } from './ImageUpload'

export function ArtistForm({ artist }: { artist: Artist | null }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveArtist, {
    status: 'idle',
  })

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {artist && <input type="hidden" name="id" value={artist.id} />}

      <Field
        label="Name"
        htmlFor="name"
        error={state.fieldErrors?.name}
      >
        <TextInput
          id="name"
          name="name"
          required
          defaultValue={artist?.name ?? ''}
          invalid={Boolean(state.fieldErrors?.name)}
        />
      </Field>

      <Field
        label="URL slug"
        htmlFor="slug"
        hint="Appears in /artist/… — changing it breaks existing links."
        error={state.fieldErrors?.slug}
      >
        <TextInput
          id="slug"
          name="slug"
          defaultValue={artist?.slug ?? ''}
          placeholder="generated from the name"
          invalid={Boolean(state.fieldErrors?.slug)}
        />
      </Field>

      <Field label="Bio" htmlFor="bio" hint="Plain text. Shown on the artist page.">
        <TextArea id="bio" name="bio" rows={6} defaultValue={artist?.bio ?? ''} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUpload
          name="avatar_url"
          label="Avatar"
          folder="avatars"
          preview="round"
          defaultValue={artist?.avatar_url}
          hint="Square works best."
        />
        <ImageUpload
          name="banner_url"
          label="Banner"
          folder="banners"
          preview="wide"
          defaultValue={artist?.banner_url}
          hint="Wide crop behind the artist name."
        />
      </div>

      <FormMessage state={state} />

      <div>
        <SubmitButton>{artist ? 'Save artist' : 'Create artist'}</SubmitButton>
      </div>
    </form>
  )
}
