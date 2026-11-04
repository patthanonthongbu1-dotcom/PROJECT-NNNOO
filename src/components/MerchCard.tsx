import Link from 'next/link'
import { Countdown } from '@/components/Countdown'
import { MERCH_TYPE_LABEL, type MerchItem } from '@/lib/merch'
import { formatDate, isUpcoming } from '@/lib/format'

/** "Bookmark · Nov 2026" or "Standee · Drops March 1, 2027". */
export function merchMeta(item: MerchItem): string {
  const when =
    item.status === 'locked'
      ? item.dropDate
        ? `Drops ${formatDate(item.dropDate)}`
        : 'Drop date TBA'
      : item.specs.released
  return `${MERCH_TYPE_LABEL[item.type]} · ${when}`
}

/**
 * Square art for an item: its first photo, or a dark tile with a lock for
 * locked items. The caller sizes and rounds it.
 */
export function MerchArt({ item, className = '' }: { item: MerchItem; className?: string }) {
  const photo = item.photos[0]
  if (item.status === 'locked' || !photo) {
    return (
      <div
        aria-hidden
        className={`grid shrink-0 place-items-center bg-merch-locked text-merch-pink ${className}`}
      >
        <LockIcon className="size-1/3 max-h-12 max-w-12" />
      </div>
    )
  }
  return (
    // Local SVG/JPG placeholders, same plain-img choice as CoverArt.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.src}
      // Cards always print the item name beside the art, so it's decorative here;
      // the item page carries each photo's real alt text.
      alt=""
      loading="lazy"
      className={`shrink-0 object-cover ${className}`}
      style={{ backgroundColor: item.colors.artBg }}
    />
  )
}

/**
 * Merch suggestion for the dark pages. `banner` is the big home-page card;
 * `small` is a compact row for song, album and artist pages.
 */
export function MerchCard({
  item,
  size,
  eyebrow,
}: {
  item: MerchItem
  size: 'banner' | 'small'
  eyebrow?: string
}) {
  if (size === 'small') {
    return (
      <Link
        href={`/merch/${item.slug}`}
        className="flex min-h-11 items-center gap-3 rounded-card p-2 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <MerchArt item={item} className="size-14 rounded-[6px]" />
        <span className="min-w-0">
          <span className="block truncate font-bold text-ink">{item.name}</span>
          <span className="block truncate text-sm text-ink-muted">{merchMeta(item)}</span>
        </span>
      </Link>
    )
  }

  const soon = item.status === 'locked' && isUpcoming(item.dropDate)

  return (
    <Link
      href={`/merch/${item.slug}`}
      className="group flex flex-col gap-5 rounded-card sm:flex-row sm:items-center bg-gradient-to-br from-merch-pink/30 via-surface-2 to-surface p-5 transition-colors hover:from-merch-pink/40 focus-visible:outline-2 focus-visible:outline-accent sm:p-6"
    >
      <MerchArt item={item} className="size-24 rounded-[6px] shadow-xl sm:size-32" />
      <span className="min-w-0">
        <span className="block text-xs font-bold tracking-wide text-merch-pink uppercase">
          {eyebrow ?? (soon ? 'Dropping soon' : 'New drop')}
        </span>
        <span className="mt-1 block text-2xl font-black break-words text-ink sm:text-3xl">
          {item.name}
        </span>
        <span className="mt-1 block text-sm text-ink-muted">{merchMeta(item)}</span>
        {soon && (
          <span className="mt-4 block">
            <Countdown date={item.dropDate!} />
          </span>
        )}
        <span className="mt-3 inline-block text-sm font-bold text-ink group-hover:underline">
          See it
        </span>
      </span>
    </Link>
  )
}

/** Titled list of small merch cards, used on album/artist/home pages. */
export function MerchRow({
  title,
  items,
  showAll = false,
}: {
  title: string
  items: MerchItem[]
  showAll?: boolean
}) {
  if (items.length === 0) return null
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {showAll && (
          <Link
            href="/merch"
            className="text-sm font-bold text-ink-muted hover:text-ink hover:underline"
          >
            Show all
          </Link>
        )}
      </div>
      <ul className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.slug}>
            <MerchCard item={item} size="small" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`fill-current ${className}`}>
      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Z" />
    </svg>
  )
}
