'use client'

import { useRouter } from 'next/navigation'
import { rememberEditMode } from './EditModeProvider'
import { PencilIcon } from '../icons'

/**
 * The way back out of the Studio: opens the real page with edit mode already
 * on.
 *
 * The cookie is written before navigating, so the server renders the page
 * editable on arrival rather than the browser flipping it afterwards. That is
 * also why this is a button and not a plain `<Link>`.
 */
export function OpenInSiteLink({
  href,
  children = 'Edit on the site',
}: {
  href: string
  children?: React.ReactNode
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        rememberEditMode(true)
        router.push(href)
      }}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <PencilIcon className="size-4" />
      {children}
    </button>
  )
}
