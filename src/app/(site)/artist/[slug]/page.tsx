import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AlbumCard } from '@/components/AlbumCard'
import { PageHeader } from '@/components/PageHeader'
import { PopularList } from '@/components/PopularList'
import { Prose } from '@/components/Prose'
import { getAlbums, getArtistBySlug, getPopularTracks } from '@/lib/queries'
import { groupByYear } from '@/lib/format'
import type { Album, Artist } from '@/lib/database.types'

/** Discography filter chips, Spotify-style. `?type=` keeps it server-only. */
const FILTERS = [
  { value: 'all', label: 'All', match: () => true },
  { value: 'albums', label: 'Albums', match: (a: Album) => a.album_type === 'album' },
  { value: 'singles', label: 'Singles & EPs', match: (a: Album) => a.album_type !== 'album' },
] as const

export async function generateMetadata(
  props: PageProps<'/artist/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const artist = await getArtistBySlug(slug)
  if (!artist) return {}

  return {
    title: artist.name,
    description: artist.bio ?? `Lyrics and credits by ${artist.name}.`,
  }
}

export default async function ArtistPage(props: PageProps<'/artist/[slug]'>) {
  const { slug } = await props.params
  const { type } = await props.searchParams
  const artist = await getArtistBySlug(slug)
  if (!artist) notFound()

  const [allAlbums, popular] = await Promise.all([getAlbums(), getPopularTracks(5)])
  const albums = allAlbums.filter((a) => a.artist_id === artist.id)
  const filter = FILTERS.find((f) => f.value === type) ?? FILTERS[0]
  const timeline = groupByYear(albums.filter(filter.match))

  const meta = albums.length > 0 && (
    <span>
      {albums.length} {albums.length === 1 ? 'release' : 'releases'}
    </span>
  )

  return (
    <>
      {artist.banner_url ? (
        <BannerHeader artist={artist} meta={meta} />
      ) : (
        <PageHeader
          eyebrow="Artist"
          title={artist.name}
          image={artist.avatar_url}
          rounded
          meta={meta}
        />
      )}

      <div className="flex flex-col gap-12 p-6 sm:p-8">
        {popular.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-bold text-ink">Popular</h2>
            <PopularList tracks={popular} albums={albums} />
          </section>
        )}

        <section>
          <h2 className="mb-4 text-2xl font-bold text-ink">Discography</h2>

          <nav aria-label="Filter releases" className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.value}
                href={f.value === 'all' ? `/artist/${artist.slug}` : `?type=${f.value}`}
                scroll={false}
                aria-current={f === filter ? 'page' : undefined}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  f === filter
                    ? 'bg-ink text-black'
                    : 'bg-surface-2 text-ink hover:bg-surface-3'
                }`}
              >
                {f.label}
              </Link>
            ))}
          </nav>

          {timeline.length === 0 ? (
            <p className="text-ink-faint">No releases yet.</p>
          ) : (
            <ol className="flex flex-col gap-10 border-l border-line pl-6">
              {timeline.map(([year, releases]) => (
                <li key={year || 'undated'} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-2 -left-[1.95rem] size-3 rounded-full bg-accent ring-4 ring-base"
                  />
                  <h3 className="mb-4 text-xl font-black text-ink tabular-nums">
                    {year || 'Undated'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                    {releases.map((album) => (
                      <AlbumCard key={album.id} album={album} />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {artist.bio && (
          <section className="max-w-3xl">
            <h2 className="mb-4 text-2xl font-bold text-ink">About</h2>
            <div className="overflow-hidden rounded-card bg-surface">
              {(artist.banner_url ?? artist.avatar_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(artist.banner_url ?? artist.avatar_url)!}
                  alt=""
                  className="aspect-[3/1] w-full object-cover"
                />
              )}
              <div className="p-6">
                <Prose text={artist.bio} />
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

/** Full-bleed banner with the name over it, as on a Spotify artist page. */
function BannerHeader({ artist, meta }: { artist: Artist; meta: React.ReactNode }) {
  return (
    <header className="relative flex min-h-72 items-end overflow-hidden sm:min-h-96">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artist.banner_url!}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent" />
      <div className="relative flex items-end gap-6 p-6 sm:p-8">
        {artist.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatar_url}
            alt=""
            className="hidden size-28 shrink-0 rounded-full object-cover shadow-2xl sm:block"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">Artist</p>
          <h1 className="mt-2 text-5xl font-black break-words text-ink sm:text-7xl lg:text-8xl">
            {artist.name}
          </h1>
          {meta && <div className="mt-4 text-sm text-ink-muted">{meta}</div>}
        </div>
      </div>
    </header>
  )
}
