import { InlineImage } from './edit/InlineImage'
import type { PatchAction } from './edit/InlineField'

/**
 * The large tinted banner at the top of artist and album pages: oversized
 * title, an eyebrow label above it, and metadata beneath.
 *
 * `title` is a node rather than a string so the page can hand over an
 * editable one; `imageEdit`, when given, makes the artwork replaceable in
 * place rather than only through the Studio form.
 */
export function PageHeader({
  eyebrow,
  title,
  meta,
  image,
  imageEdit,
  rounded = false,
}: {
  eyebrow?: string
  title: React.ReactNode
  meta?: React.ReactNode
  image?: string | null
  imageEdit?: {
    action: PatchAction
    id: string
    field: string
    folder: string
  }
  rounded?: boolean
}) {
  const shape = rounded ? 'rounded-full' : 'rounded'

  const artwork = image ? (
    // Remote Supabase Storage URLs at unknown dimensions, so a plain img
    // avoids configuring next/image for every host. This is the page's
    // largest paint, so it is fetched eagerly and at a declared size.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt=""
      width={192}
      height={192}
      fetchPriority="high"
      decoding="async"
      className={`size-48 shrink-0 object-cover shadow-2xl ${shape}`}
    />
  ) : (
    <div
      aria-hidden
      className={`grid size-48 shrink-0 place-items-center bg-surface-3 text-ink-faint shadow-2xl ${shape}`}
    >
      <svg viewBox="0 0 24 24" className="size-16 fill-current">
        <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="7" cy="18" r="2.5" />
        <circle cx="17" cy="16" r="2.5" />
      </svg>
    </div>
  )

  return (
    <header className="flex flex-col items-center gap-6 bg-gradient-to-b from-surface-3 to-transparent p-6 pt-12 sm:flex-row sm:items-end sm:p-8">
      {imageEdit ? (
        <InlineImage
          action={imageEdit.action}
          id={imageEdit.id}
          field={imageEdit.field}
          folder={imageEdit.folder}
        >
          {artwork}
        </InlineImage>
      ) : (
        artwork
      )}

      <div className="min-w-0 flex-1 text-center sm:text-left">
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
