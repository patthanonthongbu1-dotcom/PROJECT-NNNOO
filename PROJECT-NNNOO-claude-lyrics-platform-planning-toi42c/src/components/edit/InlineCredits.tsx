'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addCredit, removeCredit, type ActionState } from '@/lib/actions'
import type { Credit, CreditRole } from '@/lib/database.types'

const ROLES: { value: CreditRole; label: string }[] = [
  { value: 'writer', label: 'Writer' },
  { value: 'producer', label: 'Producer' },
  { value: 'feature', label: 'Feature' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'mastering', label: 'Mastering' },
]

/**
 * Adding and removing credits from the song's own page.
 *
 * The reading view groups credits by role, which is the wrong shape for
 * editing — you remove one name, not a line of them — so in edit mode the
 * flat list is shown underneath instead of replacing it.
 */
export function InlineCredits({
  trackId,
  credits,
}: {
  trackId: string
  credits: Credit[]
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addCredit,
    { status: 'idle' }
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the row after a successful add, so the next name can be typed
  // straight away.
  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset()
  }, [state])

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-card border border-dashed border-accent/40 bg-accent/5 p-4">
      {credits.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {credits.map((credit) => (
            <li
              key={credit.id}
              className="flex items-center justify-between gap-4 py-2"
            >
              <span className="min-w-0 text-sm">
                <span className="block truncate font-medium text-ink">
                  {credit.name}
                </span>
                <span className="block text-xs text-ink-faint">
                  {ROLES.find((role) => role.value === credit.role)?.label ??
                    credit.role}
                </span>
              </span>
              <RemoveButton creditId={credit.id} trackId={trackId} />
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-center"
      >
        <input type="hidden" name="track_id" value={trackId} />

        <label htmlFor="credit-role" className="sr-only">
          Role
        </label>
        <select
          id="credit-role"
          name="role"
          defaultValue="writer"
          className="rounded border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-2 focus:outline-offset-1 focus:outline-accent"
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        <label htmlFor="credit-name" className="sr-only">
          Name
        </label>
        <input
          id="credit-name"
          name="name"
          required
          placeholder="Who did it"
          className="rounded border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-2 focus:outline-offset-1 focus:outline-accent"
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-3 disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add credit'}
        </button>

        {state.status === 'error' && (
          <p role="alert" className="text-xs text-red-400 sm:col-span-3">
            {state.message}
          </p>
        )}
      </form>
    </div>
  )
}

function RemoveButton({
  creditId,
  trackId,
}: {
  creditId: string
  trackId: string
}) {
  const [, formAction, pending] = useActionState<ActionState, FormData>(
    removeCredit,
    { status: 'idle' }
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={creditId} />
      <input type="hidden" name="track_id" value={trackId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-bold text-ink-faint transition-colors hover:text-ink disabled:opacity-50"
      >
        {pending ? 'Removing…' : 'Remove'}
      </button>
    </form>
  )
}
