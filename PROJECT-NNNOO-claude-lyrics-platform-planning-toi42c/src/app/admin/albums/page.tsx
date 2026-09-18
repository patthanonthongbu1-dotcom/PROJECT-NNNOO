import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AlbumForm } from '@/components/admin/AlbumForm'
import { NewSingleForm } from '@/components/admin/NewSingleForm'
import type { Album } from '@/lib/database.types'
import { albumTypeLabel, releaseYear } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Albums',
}

export default async function AdminAlbumsPage() {
  await requireAdmin()

  const supabase = await createClient()
  const [albumsResult, artistResult, trackCounts] = await Promise.all([
    supabase
      .from('albums')
      .select('*')
      .order('release_date', { ascending: false, nullsFirst: false }),
    supabase.from('artists').select('id').order('created_at').limit(1).maybeSingle(),
    supabase.from('tracks').select('album_id'),
  ])

  const albums = (albumsResult.data ?? []) as Album[]
  const counts = new Map<string, number>()
  for (const row of (trackCounts.data ?? []) as { album_id: string }[]) {
    counts.set(row.album_id, (counts.get(row.album_id) ?? 0) + 1)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-ink">Albums</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {albums.length} release{albums.length === 1 ? '' : 's'}.
        </p>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-4 text-lg font-bold text-ink">Releases</h2>

        {albums.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing released yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {albums.map((album) => (
              <li key={album.id}>
                <Link
                  href={`/admin/albums/${album.id}`}
                  className="flex items-center gap-4 rounded px-2 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {album.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.cover_url}
                      alt=""
                      className="size-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="size-12 shrink-0 rounded border border-dashed border-line bg-surface-2"
                    />
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">
                      {album.title}
                    </span>
                    <span className="block truncate text-xs text-ink-faint">
                      {[
                        albumTypeLabel(album.album_type),
                        releaseYear(album.release_date),
                        `${counts.get(album.id) ?? 0} tracks`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-1 text-lg font-bold text-ink">Release a single</h2>
        {artistResult.data ? (
          <>
            <p className="mb-4 text-sm text-ink-muted">
              Creates the song and its release together, then opens the lyrics
              editor.
            </p>
            <NewSingleForm />
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Create the artist profile first.
          </p>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-1 text-lg font-bold text-ink">New album</h2>
        {artistResult.data ? (
          <>
            <p className="mb-4 text-sm text-ink-muted">
              Cover art and genres can wait — only a title is required.
            </p>
            <AlbumForm />
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Albums hang off the artist profile.{' '}
            <Link
              href="/admin/artist"
              className="font-bold text-accent underline-offset-4 hover:underline"
            >
              Create the artist first
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  )
}
