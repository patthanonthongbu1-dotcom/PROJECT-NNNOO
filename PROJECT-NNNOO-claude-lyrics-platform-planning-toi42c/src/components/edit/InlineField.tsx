'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { ActionState } from '@/lib/actions'
import { useEditMode } from './EditModeProvider'

export type PatchAction = (
  prev: ActionState,
  formData: FormData
) => Promise<ActionState>

/**
 * One piece of text, read as the page renders it and edited in the same
 * place.
 *
 * Out of edit mode it returns `children` untouched — the read-only markup the
 * server rendered — so there is exactly one description of how the text looks
 * and no chance of the editor drifting from the page.
 *
 * Saving happens on blur and on ⌘/Ctrl+Enter; Escape puts the original back.
 * A save posts only this field, which is why the actions behind it patch
 * rather than replace: nothing on screen means nothing written.
 */
export function InlineField({
  action,
  id,
  field,
  value,
  label,
  children,
  multiline = false,
  placeholder,
  className = '',
  rows,
}: {
  action: PatchAction
  /** Primary key of the row being edited. */
  id: string
  /** Column name, which is also the form field name the action reads. */
  field: string
  value: string
  /** Accessible name — there is no visible label next to inline text. */
  label: string
  children: React.ReactNode
  multiline?: boolean
  placeholder?: string
  /** Applied to the input so it can inherit the heading's own typography. */
  className?: string
  rows?: number
}) {
  const { editing } = useEditMode()
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // What the server is known to hold. Kept in a ref because it is compared
  // against inside callbacks that must not re-run when it changes.
  const saved = useRef(value)

  useEffect(() => {
    if (value === saved.current) return
    saved.current = value
    // A revalidation landed with different text. Take it, unless the cursor
    // is in this field — yanking a sentence out from under someone mid-word
    // is worse than showing them slightly stale text for a moment.
    if (document.activeElement !== fieldRef.current) setDraft(value)
  }, [value])

  // Leaving edit mode abandons anything half-typed rather than saving it by
  // surprise; the blur handler has already saved whatever was deliberate.
  useEffect(() => {
    if (!editing) {
      setDraft(saved.current)
      setError('')
    }
  }, [editing])

  const save = useCallback(() => {
    const next = draft
    if (next === saved.current) return

    const formData = new FormData()
    formData.set('id', id)
    formData.set(field, next)

    startTransition(async () => {
      const result = await action({ status: 'idle' }, formData)
      if (result.status === 'error') {
        setError(result.fieldErrors?.[field] ?? result.message ?? 'Could not save.')
        return
      }
      saved.current = next
      setError('')
      setJustSaved(true)
    })
  }, [action, draft, field, id])

  useEffect(() => {
    if (!justSaved) return
    const timer = setTimeout(() => setJustSaved(false), 1600)
    return () => clearTimeout(timer)
  }, [justSaved])

  // A textarea opens at `rows` tall regardless of what is in it, so the first
  // measurement has to happen here rather than waiting for a keystroke.
  useEffect(() => {
    const element = fieldRef.current
    if (editing && multiline && element instanceof HTMLTextAreaElement) {
      autoSize(element)
    }
  }, [editing, multiline, draft])

  if (!editing) return <>{children}</>

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setDraft(saved.current)
      setError('')
      fieldRef.current?.blur()
      return
    }
    // Blurring is what saves, so "done" of any kind routes through it:
    // ⌘/Ctrl+Enter anywhere, or plain Enter in a one-line field, where a
    // newline would have nowhere to go.
    const done =
      (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) ||
      (event.key === 'Enter' && !multiline && !event.shiftKey)

    if (done) {
      event.preventDefault()
      fieldRef.current?.blur()
    }
  }

  const fieldClass = `w-full rounded border border-dashed border-accent/50 bg-accent/5 px-2 py-1 text-inherit transition-colors focus:border-accent focus:bg-surface-2 focus:outline-2 focus:outline-offset-1 focus:outline-accent ${className}`

  return (
    <span className="relative block">
      {multiline ? (
        <textarea
          ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
          id={`inline-${field}-${id}`}
          name={field}
          value={draft}
          rows={rows ?? 3}
          placeholder={placeholder}
          aria-label={label}
          aria-busy={pending || undefined}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={onKeyDown}
          // Grows with its content, so a long bio never hides behind a
          // scrollbar the width of the page it is being typed into.
          onInput={(event) => autoSize(event.currentTarget)}
          className={fieldClass}
        />
      ) : (
        <input
          ref={fieldRef as React.RefObject<HTMLInputElement>}
          id={`inline-${field}-${id}`}
          name={field}
          type="text"
          value={draft}
          placeholder={placeholder}
          aria-label={label}
          aria-busy={pending || undefined}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={onKeyDown}
          className={fieldClass}
        />
      )}

      <InlineStatus pending={pending} saved={justSaved} error={error} />
    </span>
  )
}

function autoSize(element: HTMLTextAreaElement) {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

/** The small "Saving…/Saved" note that keeps an unattended save visible. */
export function InlineStatus({
  pending,
  saved,
  error,
}: {
  pending: boolean
  saved: boolean
  error: string
}) {
  if (error) {
    return (
      <span role="alert" className="mt-1 block text-xs font-normal text-red-400">
        {error}
      </span>
    )
  }
  if (pending) {
    return (
      <span className="mt-1 block text-xs font-normal text-ink-faint">Saving…</span>
    )
  }
  if (saved) {
    return (
      <span role="status" className="mt-1 block text-xs font-normal text-accent">
        Saved
      </span>
    )
  }
  return null
}
