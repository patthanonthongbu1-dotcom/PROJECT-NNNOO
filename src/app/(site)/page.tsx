import Link from 'next/link'
import { AlbumCard } from '@/components/AlbumCard'
import { CoverArt } from '@/components/CoverArt'
import { Countdown } from '@/components/Countdown'
import { PopularList } from '@/components/PopularList'
import {
  getAlbumBySlug,
  getAlbums,
  getArtist,
  getPopularTracks,
  getRecentTracks,
} from '@/lib/queries'
import { pickCouplet } from '@/lib/annotations'
import { albumTypeLabel, formatDate, isUpcoming } from '@/lib/format'
import type { Album, AlbumWithTracks, Track } from '@/lib/database.types'

/** Days since the epoch: the lyric of the day stays put all day (UTC). */
function dayNumber() {
  return Math.floor(Date.now() / 86_400_000)
}

export default async function HomePage() {
  const [artist, albums, recent, popular] = await Promise.all([
    getArtist(),
    getAlbums(),
    getRecentTracks(10),
    getPopularTracks(5),
  ])

  if (!artist) return <EmptyState />

  // albums is newest first, so the head is the latest release.
  const latest = albums[0] ? await getAlbumBySlug(albums[0].slug) : null
  const albumById = new Map(albums.map((album) => [album.id, album]))

  const day = dayNumber()
  const pool = [...new Map([...popular, ...recent].map((t) => [t.id, t])).values()]
    .filter((t) => t.lyrics.trim())
  const lyricTrack = pool.length > 0 ? pool[day % pool.length] : null
  const couplet = lyricTrack ? pickCouplet(lyricTrack.lyrics, day) : null

  return (
    <div className="flex flex-col gap-12 p-6 sm:p-8">
      <header className="flex items-center gap-5">
        <CoverArt src={artist.avatar_url} className="size-20 rounded-full shadow-xl sm:size-24" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-muted">Welcome to</p>
          <h1 className="mt-1 text-4xl font-black text-ink sm:text-5xl">{artist.name}</h1>
          {artist.bio && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-ink-muted">{artist.bio}</p>
          )}
        </div>
      </header>

      {latest && <LatestRelease album={latest} />}

      {(popular.length > 0 || couplet) && (
        <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
          {popular.length > 0 && (
            <Section title="Most read">
              <PopularList tracks={popular} albums={albums} />
            </Section>
          )}

          {lyricTrack && couplet && (
            <Section title="Lyric of the day">
              <Link
                href={`/lyrics/${lyricTrack.slug}`}
                className="group flex h-full flex-col justify-between gap-6 rounded-card bg-gradient-to-br from-accent/30 via-surface-2 to-surface p-6 transition-colors hover:from-accent/40"
              >
                <blockquote className="text-2xl leading-snug font-bold text-ink">
                  {couplet.map((line, i) => (
                    <span key={i} className="block">
                      {i === 0 && '“'}
                      {line}
                      {i === couplet.length - 1 && '”'}
                    </span>
                  ))}
                </blockquote>
                <p className="text-sm text-ink-muted">
                  from{' '}
                  <span className="font-bold text-ink group-hover:underline">
                    {lyricTrack.title}
                  </span>
                </p>
              </Link>
            </Section>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <Section title="Latest lyrics">
          <Shelf>
            {recent.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                album={albumById.get(track.album_id)}
              />
            ))}
          </Shelf>
        </Section>
      )}

      {albums.length > 0 && (
        <Section
          title="Discography"
          action={
            <Link
              href={`/artist/${artist.slug}`}
              className="text-sm font-bold text-ink-muted hover:text-ink hover:underline"
            >
              Show all
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {albums.slice(0, 5).map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

/** Big featured card for the newest release, cover blurred behind it. */
function LatestRelease({ album }: { album: AlbumWithTracks }) {
  // Before release only early singles are readable; the rest are locked titles.
  const first = album.tracks.find((t) => !isUpcoming(album.release_date) || t.early_release)
  const songs = album.tracks.length + album.locked.length

  return (
    <section className="relative overflow-hidden rounded-card bg-surface-2">
      {album.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={album.cover_url}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-3xl"
        />
      )}
      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
        <CoverArt src={album.cover_url} className="size-40 rounded shadow-2xl sm:size-48" />
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            {isUpcoming(album.release_date) ? 'Coming soon' : 'Latest release'} ·{' '}
            {albumTypeLabel(album.album_type)}
          </p>
          <h2 className="mt-2 text-3xl font-black break-words text-ink sm:text-5xl">
            {album.title}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {[
              album.release_date && formatDate(album.release_date),
              `${songs} ${songs === 1 ? 'song' : 'songs'}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {album.description && (
            <p className="mt-3 line-clamp-2 max-w-xl text-ink-muted">{album.description}</p>
          )}
          {album.release_date && isUpcoming(album.release_date) && (
            <div className="mt-5">
              <Countdown date={album.release_date} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {first && (
              <Link
                href={`/lyrics/${first.slug}`}
                className="rounded-full bg-accent px-6 py-3 font-bold text-black transition-colors hover:bg-accent-hover"
              >
                Read lyrics
              </Link>
            )}
            <Link
              href={`/album/${album.slug}`}
              className="rounded-full border border-ink-faint px-6 py-3 font-bold text-ink transition-colors hover:border-ink"
            >
              View {albumTypeLabel(album.album_type).toLowerCase()}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrackCard({ track, album }: { track: Track; album?: Album }) {
  return (
    <Link
      href={`/lyrics/${track.slug}`}
      className="flex w-40 shrink-0 snap-start flex-col gap-3 rounded-card p-3 transition-colors hover:bg-surface-2 sm:w-44"
    >
      <CoverArt src={track.cover_url ?? album?.cover_url} className="aspect-square w-full rounded shadow-lg" />
      <span className="min-w-0">
        <span className="block truncate font-bold text-ink">{track.title}</span>
        {album && (
          <span className="block truncate text-sm text-ink-muted">{album.title}</span>
        )}
      </span>
    </Link>
  )
}

/** Horizontally scrolling row, like a Spotify shelf. */
function Shelf({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-3 flex snap-x gap-1 overflow-x-auto pb-2">{children}</div>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {action}
      </div>
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
