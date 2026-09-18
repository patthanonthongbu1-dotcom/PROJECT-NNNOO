'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addCredit, removeCredit, type ActionState } from '@/lib/actions'
import type { Credit, CreditRole } from '@/lib/database.types'
import { ActionButton } from './ActionButton'
import { Field, FormMessage, Select, SubmitButton, TextInput } from './FormControls'

const ROLES: { value: CreditRole; label: string }[] = [
  { value: 'writer', label: 'Writer' },
  { value: 'producer', label: 'Producer' },
  { value: 'feature', label: 'Feature' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'mastering', label: 'Mastering' },
]

const ROLE_LABELS = new Map(ROLES.map((role) => [role.value, role.label]))

export function CreditsEditor({
  trackId,
  credits,
}: {
  trackId: string
  credits: Credit[]
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(addCredit, {
    status: 'idle',
  })
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the row after a successful add so the next name can be typed
  // straight away.
  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset()
  }, [state])

  return (
    <div className="flex flex-col gap-5">
      {credits.length === 0 ? (
        <p className="text-sm text-ink-faint">No credits yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {credits.map((credit) => (
            <li
              key={credit.id}
              className="flex items-center justify-between gap-4 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">
                  {credit.name}
                </span>
                <span className="block text-xs text-ink-faint">
                  {ROLE_LABELS.get(credit.role) ?? credit.role}
                </span>
              </span>
              <ActionButton
                action={removeCredit}
                fields={{ id: credit.id, track_id: trackId }}
                variant="ghost"
                pendingLabel="Removing…"
              >
                Remove
              </ActionButton>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="track_id" value={trackId} />

        <div className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <Field label="Role" htmlFor="credit-role" error={state.fieldErrors?.role}>
            <Select id="credit-role" name="role" defaultValue="writer">
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Name" htmlFor="credit-name" error={state.fieldErrors?.name}>
            <TextInput
              id="credit-name"
              name="name"
              required
              placeholder="Who did it"
              invalid={Boolean(state.fieldErrors?.name)}
            />
          </Field>

          <div className="pb-0.5">
            <SubmitButton variant="secondary" pendingLabel="Adding…">
              Add credit
            </SubmitButton>
          </div>
        </div>

        <FormMessage state={state} />
      </form>
    </div>
  )
}
