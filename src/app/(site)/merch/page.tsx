import Link from 'next/link'
import type { Metadata } from 'next'
import { CoverArt } from '@/components/CoverArt'
import { LockIcon, MerchArt, merchMeta } from '@/components/MerchCard'
import { getAlbums } from '@/lib/queries'
import { MERCH, getLatestDrop, getMerchForAlbum, getMoreMerch, type MerchItem } from '@/lib/merch'

export const metadata: Metadata = {
  title: 'Merch',
  description: 'Stuff from the nnnoo world you can actually hold. Not for sale, just for show.',
}

const FILTERS = [
  { value: 'all', label: 'All', match: () => true },
  { value: 'bookmarks', label: 'Bookmarks', match: (m: MerchItem) => m.type === 'bookmark' },
  { value: 'standees', label: 'Standees', match: (m: MerchItem) => m.type === 'standee' },
  { value: 'soon', label: 'Coming soon', match: (m: MerchItem) => m.status === 'locked' },
] as const

export default async function MerchPage(props: PageProps<'/merch'>) {
  const { type } = await props.searchParams
  const filter = FILTERS.find((f) => f.value === type) ?? FILTERS[0]
  const isAll = filter.value === 'all'

  const latest = getLatestDrop()
  // On "All" the latest drop has its own card, so the grid skips it.
  const grid = (isAll ? getMoreMerch() : MERCH).filter(filter.match)
  const locked = MERCH.filter((m) => m.status === 'locked').length

  const albums = (await getAlbums())
    .map((album) => ({ album, count: getMerchForAlbum(album.slug).length }))
    .filter((row) => row.count > 0)

  return (
    <div className="min-h-dvh bg-merch-bg text-merch-ink">
      <header className="bg-merch-tint-pink px-6 pt-4 pb-8 sm:px-8">
        <Link
          href="/"
          aria-label="Back to home"
          className="-ml-2 grid size-11 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-merch-ink"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-none stroke-current stroke-2">
            <path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end">
          <div
            aria-hidden
            className="grid size-40 shrink-0 grid-cols-2 overflow-hidden rounded-merch shadow-xl sm:size-48"
          >
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ backgroundColor: MERCH[i % MERCH.length].colors.artBg }} />
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-merch-pink-ink uppercase">
              Collection
            </p>
            <h1 className="mt-1 text-5xl font-black sm:text-7xl">Merch</h1>
            <p className="mt-3 text-sm font-bold">
              nnnoo · {MERCH.length} items · {locked} locked
            </p>
            <p className="mt-2 max-w-md text-sm text-merch-muted">
              Stuff from the nnnoo world you can actually hold. Not for sale, just for show.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-10 px-6 py-6 sm:px-8">
        {/* Plain GET form: each chip is a real button (so aria-pressed is valid)
            and the filtering stays on the server. ponytail: full page load per
            chip; swap for client state if that ever feels slow. */}
        <form action="/merch" aria-label="Filter merch" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              name="type"
              value={f.value}
              aria-pressed={f === filter}
              className={`min-h-11 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merch-ink ${
                f === filter
                  ? 'bg-merch-ink text-white'
                  : 'bg-merch-surface text-merch-ink hover:bg-black/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </form>

        {isAll && latest && (
          <Link
            href={`/merch/${latest.slug}`}
            className="flex items-center gap-4 rounded-merch bg-merch-surface p-3 transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-merch-ink"
          >
            <MerchArt item={latest} className="size-20 rounded-[6px]" />
            <span className="min-w-0">
              <span className="block text-xs font-bold tracking-wide text-merch-pink-ink uppercase">
                First ever merch
              </span>
              <span className="mt-0.5 block truncate text-lg font-bold">{latest.name}</span>
              <span className="block truncate text-sm text-merch-muted">{merchMeta(latest)}</span>
            </span>
          </Link>
        )}

        <section>
          <h2 className="mb-4 text-xl font-extrabold">{isAll ? 'More merch' : filter.label}</h2>
          {grid.length === 0 ? (
            <p className="text-merch-muted">Nothing here yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {grid.map((item) => (
                <li key={item.slug}>
                  <GridCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {albums.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold">From the albums</h2>
            <ul className="flex flex-col gap-1">
              {albums.map(({ album, count }) => (
                <li key={album.id}>
                  <Link
                    href={`/album/${album.slug}`}
                    className="flex min-h-11 items-center gap-3 rounded-merch p-2 transition-colors hover:bg-merch-surface focus-visible:outline-2 focus-visible:outline-merch-ink"
                  >
                    <CoverArt src={album.cover_url} className="size-14 rounded-[6px]" />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{album.title}</span>
                      <span className="block text-sm text-merch-muted">
                        {count} merch {count === 1 ? 'item' : 'items'}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function GridCard({ item }: { item: MerchItem }) {
  const tag =
    item.status === 'locked'
      ? { text: 'Locked', className: 'bg-merch-locked text-merch-pink' }
      : item.isLatestDrop
        ? { text: 'NEW', className: 'bg-merch-pink text-merch-ink' }
        : { text: 'Collected', className: 'bg-white text-merch-ink' }

  return (
    <Link
      href={`/merch/${item.slug}`}
      className="group flex flex-col gap-2 rounded-merch focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merch-ink"
    >
      <span className="relative block overflow-hidden rounded-merch">
        <MerchArt item={item} className="aspect-square w-full transition-transform group-hover:scale-105" />
        <span
          className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold shadow ${tag.className}`}
        >
          {tag.text}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-bold group-hover:underline">{item.name}</span>
        <span className="flex items-center gap-1 text-sm text-merch-muted">
          {item.status === 'locked' && <LockIcon className="size-3.5 shrink-0" />}
          <span className="truncate">{merchMeta(item)}</span>
        </span>
      </span>
    </Link>
  )
}
