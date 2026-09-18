'use client'

import { useFormStatus } from 'react-dom'
import type { ActionState } from '@/lib/actions'

/**
 * Form primitives shared by every admin editor.
 *
 * They exist so the dark-theme focus rings, label association and error
 * wiring are written once — hand-rolling them per form is where accessibility
 * quietly rots.
 */

const inputClass =
  'w-full rounded border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-2 focus:outline-offset-1 focus:outline-accent disabled:opacity-50'

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

type InputProps = React.ComponentPropsWithRef<'input'> & {
  invalid?: boolean
}

export function TextInput({ invalid, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      // `Field` renders the matching <p> whenever it was handed an error, so
      // this only points at an id that exists.
      aria-describedby={
        props['aria-describedby'] ?? (invalid ? `${props.id}-error` : undefined)
      }
      className={`${inputClass} ${invalid ? 'border-red-500' : ''} ${className ?? ''}`}
    />
  )
}

type TextAreaProps = React.ComponentPropsWithRef<'textarea'> & {
  invalid?: boolean
}

export function TextArea({ invalid, className, ...props }: TextAreaProps) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputClass} leading-relaxed ${invalid ? 'border-red-500' : ''} ${className ?? ''}`}
    />
  )
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<'select'> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputClass} ${invalid ? 'border-red-500' : ''} ${className ?? ''}`}
    >
      {children}
    </select>
  )
}

export function Checkbox({
  label,
  hint,
  ...props
}: React.ComponentPropsWithRef<'input'> & {
  label: string
  hint?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 size-4 shrink-0 accent-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
      />
      <span>
        <label htmlFor={props.id} className="text-sm font-bold text-ink">
          {label}
        </label>
        {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      </span>
    </div>
  )
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50'

const variants = {
  primary: 'bg-accent text-black hover:bg-accent-hover',
  secondary: 'border border-line bg-surface-2 text-ink hover:bg-surface-3',
  danger: 'border border-red-900 bg-transparent text-red-400 hover:bg-red-950',
  ghost: 'text-ink-muted hover:text-ink',
} as const

export type ButtonVariant = keyof typeof variants

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ComponentPropsWithRef<'button'> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`${buttonBase} ${variants[variant]} ${className ?? ''}`}
    />
  )
}

/**
 * Submit button that disables itself while the enclosing form is in flight.
 * `useFormStatus` only reports that for a child of the form, which is why
 * this is its own component rather than a prop on Button.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
  className,
}: {
  children: React.ReactNode
  pendingLabel?: string
  variant?: ButtonVariant
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending ? (pendingLabel ?? 'Saving…') : children}
    </Button>
  )
}

/** Result banner for an action's returned state. */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null

  const error = state.status === 'error'
  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded border px-3 py-2 text-sm ${
        error
          ? 'border-red-900 bg-red-950/40 text-red-300'
          : 'border-accent/40 bg-accent/10 text-accent'
      }`}
    >
      {state.message}
    </p>
  )
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
