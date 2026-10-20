import Link from 'next/link'
import type { LockedTrack, Track } from '@/lib/database.types'
import { formatDuration } from '@/lib/format'

const ROW =
  'grid grid-cols-[2rem_1fr_auto] items-center gap-4 rounded px-4 py-2'

/**
 * One line of a tracklist: number, title, duration. A locked track (on an
 * upcoming album, not out early as a single) is greyed out and not a link.
 */
export function TrackRow({
  track,
  index,
  locked = false,
}: {
  track: LockedTrack & Partial<Pick<Track, 'slug' | 'published'>>
  index: number
  locked?: boolean
}) {
  const number = track.track_number ?? index + 1

  if (locked || !track.slug) {
    return (
      <li className={`${ROW} opacity-40`} title="Lyrics unlock on release day">
        <span className="text-right text-sm tabular-nums text-ink-faint">{number}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-ink">{track.title}</span>
          <svg viewBox="0 0 24 24" aria-label="Locked" className="size-3.5 shrink-0 fill-ink-faint">
            <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Z" />
          </svg>
        </span>
        <span className="text-sm tabular-nums text-ink-faint">
          {formatDuration(track.duration_seconds)}
        </span>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={`/lyrics/${track.slug}`}
        className={`group ${ROW} transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent`}
      >
        <span className="text-right text-sm tabular-nums text-ink-faint group-hover:text-ink">
          {number}
        </span>

        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">
            {track.title}
          </span>
          {!track.published && (
            <span className="text-xs font-medium text-ink-faint">Draft</span>
          )}
        </span>

        <span className="text-sm tabular-nums text-ink-faint">
          {formatDuration(track.duration_seconds)}
        </span>
      </Link>
    </li>
  )
}
