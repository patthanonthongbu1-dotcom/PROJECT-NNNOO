'use client'

import { useEditMode } from './EditModeProvider'

/** Renders its children only while the edit-mode switch is on. */
export function EditOnly({ children }: { children: React.ReactNode }) {
  const { editing } = useEditMode()
  if (!editing) return null
  return <>{children}</>
}

/** The inverse: reading-view chrome that steps aside while editing. */
export function ReadOnly({ children }: { children: React.ReactNode }) {
  const { editing } = useEditMode()
  if (editing) return null
  return <>{children}</>
}
