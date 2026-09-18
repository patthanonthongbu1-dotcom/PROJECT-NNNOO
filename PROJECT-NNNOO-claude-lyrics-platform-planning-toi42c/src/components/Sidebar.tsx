import Link from 'next/link'
import type { Album, Artist } from '@/lib/database.types'
import { albumTypeLabel, releaseYear } from '@/lib/format'
import { ArtistIcon, HomeIcon, NoteIcon, SearchIcon, StudioIcon } from './icons'
import { EditModeToggle } from './edit/EditModeToggle'

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
          {/* Signed out, this lands on the login screen — the proxy sees to
              that — so it can be an ordinary tab rather than a hidden door.
              Not prefetched: for a reader the prefetch only ever warms a
              redirect, on every page they visit. */}
          <NavLink
            href="/admin"
            label="Studio"
            icon={<StudioIcon />}
            prefetch={false}
            rel="nofollow"
          />
        </ul>

        {/* Renders nothing unless the visitor is an admin. */}
        <div className="px-3 pt-2 pb-1 empty:hidden">
          <EditModeToggle className="w-full justify-center" />
        </div>
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
    // The width and height are what the layout reserves, so a slow cover
    // cannot shove the list around as it arrives.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={album.cover_url}
      alt=""
      width={48}
      height={48}
      className="size-12 shrink-0 rounded object-cover"
      loading="lazy"
      decoding="async"
    />
  )
}

function NavLink({
  href,
  label,
  icon,
  prefetch,
  rel,
}: {
  href: string
  label: string
  icon: React.ReactNode
  prefetch?: false
  rel?: string
}) {
  return (
    <li>
      <Link
        href={href}
        prefetch={prefetch}
        rel={rel}
        className="flex items-center gap-4 rounded px-3 py-2 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
      >
        <span aria-hidden className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </Link>
    </li>
  )
}
