'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { EDIT_MODE_COOKIE, EDIT_MODE_MAX_AGE } from '@/lib/edit-mode'

interface EditModeValue {
  /** Whether this visitor is an admin at all. False for everyone else. */
  canEdit: boolean
  /** Whether the editing affordances are currently showing. */
  editing: boolean
  setEditing: (editing: boolean) => void
}

const EditModeContext = createContext<EditModeValue>({
  canEdit: false,
  editing: false,
  setEditing: () => {},
})

export function useEditMode(): EditModeValue {
  return useContext(EditModeContext)
}

/** Writes the preference the server reads on the next full load. */
export function rememberEditMode(editing: boolean) {
  document.cookie = `${EDIT_MODE_COOKIE}=${editing ? '1' : '0'}; path=/; max-age=${EDIT_MODE_MAX_AGE}; samesite=lax`
}

/**
 * Holds the edit-mode switch for the whole public site.
 *
 * `canEdit` and the initial `editing` are both decided on the server, so the
 * first paint is already correct; this only keeps the two in sync as the
 * toggle is flipped, and writes the cookie so the next full load starts in
 * the same mode. Deliberately no `router.refresh()`: every editable control
 * is already on the page waiting for the flag, so a round trip would buy a
 * flash and nothing else.
 */
export function EditModeProvider({
  canEdit,
  initialEditing,
  children,
}: {
  canEdit: boolean
  initialEditing: boolean
  children: React.ReactNode
}) {
  const [editing, setEditingState] = useState(initialEditing)

  const setEditing = useCallback(
    (next: boolean) => {
      if (!canEdit) return
      setEditingState(next)
      rememberEditMode(next)
    },
    [canEdit]
  )

  const value = useMemo(
    () => ({ canEdit, editing: canEdit && editing, setEditing }),
    [canEdit, editing, setEditing]
  )

  return (
    <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>
  )
}
