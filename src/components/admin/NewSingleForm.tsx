'use client'

import { useActionState } from 'react'
import { createSingle, type ActionState } from '@/lib/actions'
import { Field, FormMessage, SubmitButton, TextInput } from './FormControls'

/**
 * One title in, one song out. The release that holds it is made behind the
 * scenes, so putting out a single never means inventing an album first.
 */
export function NewSingleForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createSingle,
    { status: 'idle' }
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field
          label="Title"
          htmlFor="single-title"
          error={state.fieldErrors?.title}
        >
          <TextInput
            id="single-title"
            name="title"
            required
            placeholder="Song name"
            invalid={Boolean(state.fieldErrors?.title)}
          />
        </Field>

        <Field label="Release date" htmlFor="single-date" hint="Optional.">
          <TextInput id="single-date" name="release_date" type="date" />
        </Field>
      </div>

      <FormMessage state={state} />

      <div>
        <SubmitButton>Release single</SubmitButton>
      </div>
    </form>
  )
}
