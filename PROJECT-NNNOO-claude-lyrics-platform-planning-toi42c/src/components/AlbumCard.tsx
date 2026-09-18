import Link from 'next/link'
import type { Album } from '@/lib/database.types'
import { albumTypeLabel, releaseYear } from '@/lib/format'

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link
      href={`/album/${album.slug}`}
      className="group flex flex-col gap-3 rounded-card bg-surface p-4 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded shadow-lg">
        {album.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.cover_url}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden
            className="grid size-full place-items-center bg-gradient-to-br from-surface-3 to-surface text-ink-faint"
          >
            <svg viewBox="0 0 24 24" className="size-12 fill-current">
              <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="7" cy="18" r="2.5" />
              <circle cx="17" cy="16" r="2.5" />
            </svg>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-bold text-ink">{album.title}</h3>
        <p className="truncate text-sm text-ink-muted">
          {[releaseYear(album.release_date), albumTypeLabel(album.album_type)]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </Link>
  )
}
