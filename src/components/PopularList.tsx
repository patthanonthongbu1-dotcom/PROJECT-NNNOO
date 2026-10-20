import Link from 'next/link'
import type { Album, Track } from '@/lib/database.types'
import { formatViews } from '@/lib/format'
import { CoverArt } from './CoverArt'

/** Ranked tracks with read counts, like Spotify's "Popular" list. */
export function PopularList({
  tracks,
  albums = [],
}: {
  tracks: Track[]
  /** Looked up by album_id to show each track's cover and release. */
  albums?: Album[]
}) {
  const albumById = new Map(albums.map((album) => [album.id, album]))

  return (
    <ol className="flex flex-col">
      {tracks.map((track, i) => {
        const album = albumById.get(track.album_id)
        return (
          <li key={track.id}>
            <Link
              href={`/lyrics/${track.slug}`}
              className="grid grid-cols-[2rem_auto_1fr_auto] items-center gap-4 rounded px-4 py-2 transition-colors hover:bg-surface-2"
            >
              <span className="text-right tabular-nums text-ink-faint">
                {i + 1}
              </span>
              <CoverArt src={track.cover_url ?? album?.cover_url} className="size-10 rounded" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">
                  {track.title}
                </span>
                {album && (
                  <span className="block truncate text-sm text-ink-muted">
                    {album.title}
                  </span>
                )}
              </span>
              <span className="text-sm tabular-nums text-ink-faint">
                {formatViews(track.view_count)}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
