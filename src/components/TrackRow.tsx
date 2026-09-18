import Link from 'next/link'
import type { Track } from '@/lib/database.types'
import { formatDuration } from '@/lib/format'

/** One line of a tracklist: number, title, duration. */
export function TrackRow({
  track,
  index,
}: {
  track: Track
  index: number
}) {
  return (
    <li>
      <Link
        href={`/lyrics/${track.slug}`}
        className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 rounded px-4 py-2 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="text-right text-sm tabular-nums text-ink-faint group-hover:text-ink">
          {track.track_number ?? index + 1}
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
