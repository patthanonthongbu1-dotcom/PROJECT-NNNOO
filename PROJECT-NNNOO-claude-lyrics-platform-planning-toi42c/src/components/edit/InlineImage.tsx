'use client'

import { useState, useTransition } from 'react'
import { uploadImage } from '@/lib/actions'
import { useEditMode } from './EditModeProvider'
import type { PatchAction } from './InlineField'

/**
 * Cover art and avatars, replaceable from the page they appear on.
 *
 * Two steps behind one control: `uploadImage` puts the file in the `media`
 * bucket and hands back a URL, then the row is patched to point at it. Both
 * already exist for the Studio forms; this is the same pair without the form.
 */
export function InlineImage({
  action,
  id,
  field,
  folder,
  children,
}: {
  action: PatchAction
  id: string
  field: string
  folder: string
  /** The image as the reading view renders it. */
  children: React.ReactNode
}) {
  const { editing } = useEditMode()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const inputId = `cover-${id}-${field}`

  if (!editing) return <>{children}</>

  function handleFile(file: File | undefined) {
    if (!file) return
    setError('')

    const upload = new FormData()
    upload.append('file', file)
    upload.append('folder', folder)

    startTransition(async () => {
      const uploaded = await uploadImage({ status: 'idle' }, upload)
      if (uploaded.status === 'error' || !uploaded.url) {
        setError(uploaded.message ?? 'Upload failed.')
        return
      }

      const patch = new FormData()
      patch.set('id', id)
      patch.set(field, uploaded.url)
      const saved = await action({ status: 'idle' }, patch)
      if (saved.status === 'error') setError(saved.message ?? 'Could not save.')
    })
  }

  return (
    <span className="relative block shrink-0">
      {children}

      <label
        htmlFor={inputId}
        className="absolute inset-0 grid cursor-pointer place-items-center rounded bg-black/60 text-sm font-bold text-ink opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100"
      >
        {pending ? 'Uploading…' : 'Change'}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          disabled={pending}
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </label>

      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-400">
          {error}
        </span>
      )}
    </span>
  )
}
