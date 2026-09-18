'use client'

import { useActionState } from 'react'
import type { ActionState } from '@/lib/actions'
import { SubmitButton, type ButtonVariant } from './FormControls'

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>

/**
 * A one-button form around a Server Action.
 *
 * Buttons like "delete" and "publish" each need their own `<form>` — forms
 * cannot nest — so this wraps the boilerplate instead of repeating it in
 * every editor.
 */
export function ActionButton({
  action,
  fields,
  children,
  pendingLabel,
  variant = 'secondary',
  confirm,
}: {
  action: Action
  fields: Record<string, string>
  children: React.ReactNode
  pendingLabel?: string
  variant?: ButtonVariant
  /** Shown in a browser confirm() before destructive submits. */
  confirm?: string
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {
    status: 'idle',
  })

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault()
      }}
      className="flex flex-col items-start gap-1"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton variant={variant} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
      {state.status === 'error' && (
        <p role="alert" className="text-xs text-red-400">
          {state.message}
        </p>
      )}
    </form>
  )
}
