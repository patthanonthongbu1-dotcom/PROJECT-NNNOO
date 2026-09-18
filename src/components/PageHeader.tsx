/**
 * The large tinted banner at the top of artist and album pages: oversized
 * title, an eyebrow label above it, and metadata beneath.
 */
export function PageHeader({
  eyebrow,
  title,
  meta,
  image,
  rounded = false,
}: {
  eyebrow?: string
  title: string
  meta?: React.ReactNode
  image?: string | null
  rounded?: boolean
}) {
  return (
    <header className="flex flex-col items-center gap-6 bg-gradient-to-b from-surface-3 to-transparent p-6 pt-12 sm:flex-row sm:items-end sm:p-8">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className={`size-48 shrink-0 object-cover shadow-2xl ${
            rounded ? 'rounded-full' : 'rounded'
          }`}
        />
      ) : (
        <div
          aria-hidden
          className={`grid size-48 shrink-0 place-items-center bg-surface-3 text-ink-faint shadow-2xl ${
            rounded ? 'rounded-full' : 'rounded'
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-16 fill-current">
            <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="7" cy="18" r="2.5" />
            <circle cx="17" cy="16" r="2.5" />
          </svg>
        </div>
      )}

      <div className="min-w-0 text-center sm:text-left">
        {eyebrow && (
          <p className="text-sm font-bold text-ink-muted">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-4xl font-black break-words text-ink sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        {meta && <div className="mt-4 text-sm text-ink-muted">{meta}</div>}
      </div>
    </header>
  )
}
