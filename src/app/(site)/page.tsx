import Link from 'next/link'
import { AlbumCard } from '@/components/AlbumCard'
import { getAlbums, getArtist, getPopularTracks, getRecentTracks } from '@/lib/queries'
import { formatViews } from '@/lib/format'

export default async function HomePage() {
  const [artist, albums, recent, popular] = await Promise.all([
    getArtist(),
    getAlbums(),
    getRecentTracks(8),
    getPopularTracks(5),
  ])

  if (!artist) return <EmptyState />

  return (
    <div className="p-6 sm:p-8">
      <p className="text-sm font-bold text-ink-muted">Welcome to</p>
      <h1 className="mt-1 text-4xl font-black text-ink sm:text-5xl">
        {artist.name}
      </h1>
      {artist.bio && (
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">
          {artist.bio}
        </p>
      )}

      {albums.length > 0 && (
        <Section title="Releases">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </Section>
      )}

      {popular.length > 0 && (
        <Section title="Most read">
          <ol className="flex flex-col">
            {popular.map((track, i) => (
              <li key={track.id}>
                <Link
                  href={`/lyrics/${track.slug}`}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 rounded px-4 py-3 transition-colors hover:bg-surface-2"
                >
                  <span className="text-right tabular-nums text-ink-faint">
                    {i + 1}
                  </span>
                  <span className="truncate font-medium text-ink">
                    {track.title}
                  </span>
                  <span className="text-sm tabular-nums text-ink-faint">
                    {formatViews(track.view_count)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Latest lyrics">
          <ul className="grid gap-2 sm:grid-cols-2">
            {recent.map((track) => (
              <li key={track.id}>
                <Link
                  href={`/lyrics/${track.slug}`}
                  className="block truncate rounded bg-surface px-4 py-3 font-medium text-ink transition-colors hover:bg-surface-2"
                >
                  {track.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-2xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  )
}

/** Shown before anything has been created, with the path to fixing that. */
function EmptyState() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-8 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-black text-ink">Nothing here yet</h1>
        <p className="mt-4 text-ink-muted">
          Create your artist profile and first release from the admin panel to
          get started.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-full bg-accent px-8 py-3 font-bold text-black transition-colors hover:bg-accent-hover"
        >
          Go to admin
        </Link>
      </div>
    </div>
  )
}
