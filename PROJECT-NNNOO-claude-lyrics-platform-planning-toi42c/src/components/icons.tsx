/**
 * Inline icons, kept in one file so the sidebar and the mobile tab bar draw
 * the same glyph rather than two copies of nearly the same path — and so the
 * bundle stays free of an icon dependency.
 *
 * Every icon is sized by its class, defaulting to the 24px grid it is drawn
 * on. They are decorative: the label beside them carries the meaning.
 */

type IconProps = { className?: string }

export function HomeIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${className} fill-current`}>
      <path d="M12 3 2 12h3v9h6v-6h2v6h6v-9h3L12 3Z" />
    </svg>
  )
}

export function SearchIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`${className} fill-none stroke-current stroke-2`}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" strokeLinecap="round" />
    </svg>
  )
}

export function ArtistIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${className} fill-current`}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.5V21h14v-2.5C19 16 16 14 12 14Z" />
    </svg>
  )
}

/** Mixing-desk faders: the Studio is where the knobs live. */
export function StudioIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`${className} fill-none stroke-current stroke-2`}
    >
      <path d="M6 21V14M6 10V3M12 21v-9M12 8V3M18 21v-5M18 12V3" strokeLinecap="round" />
      <circle cx="6" cy="12" r="2" className="fill-current" />
      <circle cx="12" cy="10" r="2" className="fill-current" />
      <circle cx="18" cy="14" r="2" className="fill-current" />
    </svg>
  )
}

export function PencilIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`${className} fill-none stroke-current stroke-2`}
    >
      <path
        d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z"
        strokeLinejoin="round"
      />
      <path d="m14 6 4 4" />
    </svg>
  )
}

export function NoteIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${className} fill-current`}>
      <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="16" r="2.5" />
    </svg>
  )
}

export function CloseIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`${className} fill-none stroke-current stroke-2`}
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`${className} fill-none stroke-current stroke-2`}
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
