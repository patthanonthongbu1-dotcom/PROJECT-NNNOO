'use client'

import { useId, useState, useTransition } from 'react'
import { uploadImage } from '@/lib/actions'
import { Button, Field, TextInput } from './FormControls'

/**
 * Image picker that uploads straight to the `media` bucket and keeps the
 * resulting URL in a hidden input for the surrounding form.
 *
 * The action is called directly rather than through its own `<form>`: this
 * control is rendered inside another form, and forms cannot nest.
 */
export function ImageUpload({
  name,
  label,
  folder,
  defaultValue,
  hint,
  preview = 'square',
}: {
  name: string
  label: string
  folder: string
  defaultValue?: string | null
  hint?: string
  preview?: 'square' | 'round' | 'wide'
}) {
  const fieldId = useId()
  const [url, setUrl] = useState(defaultValue ?? '')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleFile(file: File | undefined) {
    if (!file) return
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    startTransition(async () => {
      const result = await uploadImage({ status: 'idle' }, formData)
      if (result.status === 'error' || !result.url) {
        setError(result.message ?? 'Upload failed.')
        return
      }
      setUrl(result.url)
    })
  }

  const previewClass =
    preview === 'round'
      ? 'size-24 rounded-full'
      : preview === 'wide'
        ? 'h-24 w-full rounded'
        : 'size-24 rounded'

  return (
    <div className="flex flex-col gap-3">
      <Field label={label} htmlFor={fieldId} hint={hint}>
        <TextInput
          id={fieldId}
          name={name}
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
        />
      </Field>

      <div className="flex items-center gap-4">
        {url ? (
          // Remote Supabase Storage URLs at unknown dimensions, so a plain
          // img avoids configuring next/image for every host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className={`${previewClass} shrink-0 border border-line object-cover`}
          />
        ) : (
          <span
            aria-hidden
            className={`${previewClass} shrink-0 border border-dashed border-line bg-surface-2`}
          />
        )}

        <div className="flex flex-col items-start gap-2">
          <label
            htmlFor={`${fieldId}-file`}
            className="cursor-pointer rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-3 focus-within:outline-2 focus-within:outline-accent"
          >
            {pending ? 'Uploading…' : 'Upload image'}
            <input
              id={`${fieldId}-file`}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={pending}
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>

          {url && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUrl('')}
              className="px-0"
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
