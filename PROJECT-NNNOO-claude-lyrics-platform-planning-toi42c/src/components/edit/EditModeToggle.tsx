'use client'

import { useEditMode } from './EditModeProvider'
import { PencilIcon } from '../icons'

/**
 * The switch that turns the site into its own editor.
 *
 * Renders nothing at all for a reader — not a disabled control, not a hidden
 * one — so the reading view has no idea an editor exists.
 */
export function EditModeToggle({ className = '' }: { className?: string }) {
  const { canEdit, editing, setEditing } = useEditMode()
  if (!canEdit) return null

  return (
    <button
      type="button"
      onClick={() => setEditing(!editing)}
      aria-pressed={editing}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        editing
          ? 'bg-accent text-black hover:bg-accent-hover'
          : 'border border-line bg-surface-2 text-ink-muted hover:text-ink'
      } ${className}`}
    >
      <PencilIcon className="size-4" />
      {editing ? 'Editing' : 'Edit'}
    </button>
  )
}

/**
 * The same switch, floating above the content. On a phone it sits clear of
 * the tab bar; on a desktop the sidebar carries its own copy, so this one
 * only shows where there is no sidebar.
 */
export function FloatingEditToggle() {
  const { canEdit } = useEditMode()
  if (!canEdit) return null

  return (
    <div className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 lg:hidden">
      <EditModeToggle className="shadow-lg shadow-black/40" />
    </div>
  )
}
