import Link from 'next/link'
import type { Album, Artist } from '@/lib/database.types'
import { albumTypeLabel, releaseYear } from '@/lib/format'

/** Spotify-style persistent left rail: nav on top, discography below. */
export function Sidebar({
  artist,
  albums,
}: {
  artist: Artist | null
  albums: Album[]
}) {
  return (
    <nav
      aria-label="Main"
      className="flex h-full w-full flex-col gap-2 overflow-hidden"
    >
      <div className="rounded-card bg-surface p-2">
        <ul className="flex flex-col">
          <NavLink href="/" label="Home" icon={<HomeIcon />} />
          <NavLink href="/search" label="Search" icon={<SearchIcon />} />
          {artist && (
            <NavLink
              href={`/artist/${artist.slug}`}
              label={artist.name}
              icon={<ArtistIcon />}
            />
          )}
        </ul>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-card bg-surface">
        <h2 className="px-4 pt-4 pb-2 text-sm font-bold tracking-wide text-ink-muted">
          Discography
        </h2>
        {albums.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-ink-faint">
            No releases yet.
          </p>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {albums.map((album) => (
              <li key={album.id}>
                <Link
                  href={`/album/${album.slug}`}
                  className="flex items-center gap-3 rounded p-2 transition-colors hover:bg-surface-2"
                >
                  <Cover album={album} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {album.title}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {[albumTypeLabel(album.album_type), releaseYear(album.release_date)]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
}

function Cover({ album }: { album: Album }) {
  if (!album.cover_url) {
    return (
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded bg-surface-3 text-ink-faint"
      >
        <NoteIcon />
      </span>
    )
  }
  return (
    // Covers come from Supabase Storage at unknown dimensions, so a plain img
    // avoids having to whitelist and size every remote host for next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={album.cover_url}
      alt=""
      className="size-12 shrink-0 rounded object-cover"
      loading="lazy"
    />
  )
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 rounded px-3 py-2 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
      >
        <span aria-hidden className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </Link>
    </li>
  )
}

/* Inline icons keep the bundle free of an icon dependency. */

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-current">
      <path d="M12 3 2 12h3v9h6v-6h2v6h6v-9h3L12 3Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-2">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" strokeLinecap="round" />
    </svg>
  )
}

function ArtistIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-current">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.5V21h14v-2.5C19 16 16 14 12 14Z" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-current">
      <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="16" r="2.5" />
    </svg>
  )
}
