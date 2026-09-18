import { isAdmin } from '@/lib/auth'
import { InlineField, type PatchAction } from './InlineField'

/**
 * Server-side gate in front of `InlineField`.
 *
 * A reader gets `children` back and none of the editor's JavaScript — the
 * check happens here, on the server, rather than inside a client component
 * that would have to ship first and then decide it had nothing to do.
 *
 * `isAdmin()` is memoised per request, so a page can wrap a dozen fields in
 * this and still make one database call.
 */
export async function Editable({
  action,
  id,
  field,
  value,
  label,
  children,
  multiline,
  placeholder,
  className,
  rows,
}: {
  action: PatchAction
  id: string
  field: string
  value: string
  label: string
  children: React.ReactNode
  multiline?: boolean
  placeholder?: string
  className?: string
  rows?: number
}) {
  if (!(await isAdmin())) return <>{children}</>

  return (
    <InlineField
      action={action}
      id={id}
      field={field}
      value={value}
      label={label}
      multiline={multiline}
      placeholder={placeholder}
      className={className}
      rows={rows}
    >
      {children}
    </InlineField>
  )
}

/**
 * Shows its children only in edit mode — the wrapper for controls that have
 * no reading-view equivalent at all, like a publish switch or an "add" row.
 */
export async function AdminOnly({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) return null
  return <>{children}</>
}
