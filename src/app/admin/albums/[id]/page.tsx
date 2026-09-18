import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { deleteAlbum } from '@/lib/actions'
import { AlbumForm } from '@/components/admin/AlbumForm'
import { ActionButton } from '@/components/admin/ActionButton'
import type { Album, Track } from '@/lib/database.types'
import { formatDuration } from '@/lib/format'

export async function generateMetadata({ params }: PageProps<'/admin/albums/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('albums').select('title').eq('id', id).maybeSingle()
  return { title: data?.title ?? 'Album' }
}

export default async function AdminAlbumPage({
  params,
}: PageProps<'/admin/albums/[id]'>) {
  await requireAdmin()
  const { id } = await params

  const supabase = await createClient()
  const [albumResult, tracksResult] = await Promise.all([
    supabase.from('albums').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('tracks')
      .select('*')
      .eq('album_id', id)
      .order('track_number', { nullsFirst: false }),
  ])

  if (!albumResult.data) notFound()

  const album = albumResult.data as Album
  const tracks = (tracksResult.data ?? []) as Track[]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/albums"
          className="text-sm font-bold text-ink-muted transition-colors hover:text-ink"
        >
          ← Albums
        </Link>
        <h1 className="text-3xl font-black text-ink">{album.title}</h1>
        <p className="text-sm text-ink-muted">
          Public at{' '}
          <Link
            href={`/album/${album.slug}`}
            className="text-accent underline-offset-4 hover:underline"
          >
            /album/{album.slug}
          </Link>
        </p>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-4 text-lg font-bold text-ink">Details</h2>
        <AlbumForm album={album} />
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Tracks</h2>
          <Link
            href="/admin/tracks"
            className="text-sm font-bold text-accent underline-offset-4 hover:underline"
          >
            Add a track
          </Link>
        </div>

        {tracks.length === 0 ? (
          <p className="text-sm text-ink-faint">No tracks on this release yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {tracks.map((track, index) => (
              <li key={track.id}>
                <Link
                  href={`/admin/tracks/${track.id}`}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 rounded px-2 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="text-right text-sm tabular-nums text-ink-faint">
                    {track.track_number ?? index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">
                      {track.title}
                    </span>
                    {!track.published && (
                      <span className="text-xs font-medium text-ink-faint">
                        Draft
                      </span>
                    )}
                  </span>
                  <span className="text-sm tabular-nums text-ink-faint">
                    {formatDuration(track.duration_seconds)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-red-950 bg-surface p-5">
        <h2 className="text-lg font-bold text-ink">Danger zone</h2>
        <p className="mt-1 mb-4 text-sm text-ink-muted">
          Deleting this album deletes its {tracks.length} track
          {tracks.length === 1 ? '' : 's'} and everything attached to them.
        </p>
        <ActionButton
          action={deleteAlbum}
          fields={{ id: album.id }}
          variant="danger"
          pendingLabel="Deleting…"
          confirm={`Delete "${album.title}" and all of its tracks? This cannot be undone.`}
        >
          Delete album
        </ActionButton>
      </section>
    </div>
  )
}
