'use client'

import { useActionState, useState } from 'react'
import { createMerch, updateMerch, type ActionState } from '@/lib/actions'
import type { Album } from '@/lib/database.types'
import { MERCH_TYPE_LABEL, type MerchItem, type MerchPhoto } from '@/lib/merch'
import {
  Button,
  Checkbox,
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextInput,
} from './FormControls'
import { ImageUpload } from './ImageUpload'

const EMPTY_PHOTO: MerchPhoto = { src: '', alt: '', label: '' }

export function MerchForm({
  item,
  albums,
}: {
  item?: MerchItem
  albums: Pick<Album, 'id' | 'title'>[]
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    item ? updateMerch : createMerch,
    { status: 'idle' }
  )

  // Each row keeps a stable key so removing one doesn't reshuffle the others' uploads.
  const [photos, setPhotos] = useState(() =>
    // Index keys at first render so server and browser agree on the ids.
    (item?.photos.length ? item.photos : [EMPTY_PHOTO]).map((photo, i) => ({
      key: String(i),
      ...photo,
    }))
  )

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {item && <input type="hidden" name="id" value={item.id} />}

      <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
        <TextInput
          id="name"
          name="name"
          required
          defaultValue={item?.name ?? ''}
          invalid={Boolean(state.fieldErrors?.name)}
        />
      </Field>

      {item && (
        <Field
          label="URL slug"
          htmlFor="slug"
          hint="Appears in /merch/… — changing it breaks existing links."
          error={state.fieldErrors?.slug}
        >
          <TextInput
            id="slug"
            name="slug"
            defaultValue={item.slug}
            invalid={Boolean(state.fieldErrors?.slug)}
          />
        </Field>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Type" htmlFor="type">
          <Select id="type" name="type" defaultValue={item?.type ?? 'bookmark'}>
            {Object.entries(MERCH_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Album" htmlFor="album_id" hint="Shows this item on that album's pages.">
          <Select id="album_id" name="album_id" defaultValue={item?.albumId ?? ''}>
            <option value="">None</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={item?.status ?? 'collected'}>
            <option value="collected">Collected (in hand)</option>
            <option value="locked">Locked (coming soon)</option>
          </Select>
        </Field>

        <Field label="Drop date" htmlFor="drop_date" hint="For locked items: drives the countdown.">
          <TextInput
            id="drop_date"
            name="drop_date"
            type="date"
            defaultValue={item?.dropDate ?? ''}
          />
        </Field>
      </div>

      <Checkbox
        id="is_latest_drop"
        name="is_latest_drop"
        label="Latest drop"
        hint="Featured on the home page and at the top of /merch. Only one item at a time."
        defaultChecked={item?.isLatestDrop ?? false}
      />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-bold text-ink">Liner notes</legend>
        <p className="-mt-2 text-xs text-ink-faint">Leave any blank to hide it.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Size" htmlFor="size">
            <TextInput id="size" name="size" defaultValue={item?.specs.size ?? ''} placeholder="5.5 × 16 cm" />
          </Field>
          <Field label="Finish" htmlFor="finish">
            <TextInput id="finish" name="finish" defaultValue={item?.specs.finish ?? ''} placeholder="Matte" />
          </Field>
          <Field label="Printed by" htmlFor="printed_by">
            <TextInput id="printed_by" name="printed_by" defaultValue={item?.specs.printedBy ?? ''} />
          </Field>
          <Field label="Released" htmlFor="released">
            <TextInput id="released" name="released" defaultValue={item?.specs.released ?? ''} placeholder="Nov 2026" />
          </Field>
          <Field label="Edition" htmlFor="edition">
            <TextInput id="edition" name="edition" defaultValue={item?.specs.edition ?? ''} placeholder="18 copies" />
          </Field>
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Header color" htmlFor="header_tint" hint="Light tint behind the item page header.">
          <TextInput
            id="header_tint"
            name="header_tint"
            type="color"
            defaultValue={item?.colors.headerTint ?? '#FBE3EC'}
            className="h-11 p-1"
          />
        </Field>
        <Field label="Art color" htmlFor="art_bg" hint="Behind the photos and on cards.">
          <TextInput
            id="art_bg"
            name="art_bg"
            type="color"
            defaultValue={item?.colors.artBg ?? '#F48FB1'}
            className="h-11 p-1"
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-bold text-ink">Photos</legend>
        <p className="-mt-2 text-xs text-ink-faint">
          First photo is the main one. Check the background for anything that shows where you live.
        </p>
        {photos.map((photo, i) => (
          <div key={photo.key} className="flex flex-col gap-4 rounded border border-line p-4">
            <ImageUpload
              name="photo_src"
              label={`Photo ${i + 1}`}
              folder="merch"
              defaultValue={photo.src}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Description"
                htmlFor={`photo_alt_${photo.key}`}
                hint="What's in the photo, for screen readers."
              >
                <TextInput id={`photo_alt_${photo.key}`} name="photo_alt" defaultValue={photo.alt} />
              </Field>
              <Field label="Caption" htmlFor={`photo_label_${photo.key}`} hint='e.g. "Banana for scale"'>
                <TextInput id={`photo_label_${photo.key}`} name="photo_label" defaultValue={photo.label} />
              </Field>
            </div>
            <div>
              <Button
                type="button"
                variant="ghost"
                className="px-0"
                onClick={() => setPhotos((rows) => rows.filter((row) => row.key !== photo.key))}
              >
                Remove photo {i + 1}
              </Button>
            </div>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPhotos((rows) => [...rows, { key: crypto.randomUUID(), ...EMPTY_PHOTO }])}
          >
            Add photo
          </Button>
        </div>
      </fieldset>

      <FormMessage state={state} />

      <div>
        <SubmitButton>{item ? 'Save merch' : 'Create merch'}</SubmitButton>
      </div>
    </form>
  )
}
