/** Album cover, or a music-note placeholder when there is none. */
export function CoverArt({
  src,
  className = '',
}: {
  src: string | null | undefined
  className?: string
}) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={`grid shrink-0 place-items-center bg-gradient-to-br from-surface-3 to-surface text-ink-faint ${className}`}
      >
        <svg viewBox="0 0 24 24" className="size-1/2 max-h-12 max-w-12 fill-current">
          <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="7" cy="18" r="2.5" />
          <circle cx="17" cy="16" r="2.5" />
        </svg>
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={`shrink-0 object-cover ${className}`} />
}
