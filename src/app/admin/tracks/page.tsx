import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NewTrackForm } from '@/components/admin/NewTrackForm'
import type { Album, Track } from '@/lib/database.types'
import { formatDuration } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Tracks',
}

export default async function AdminTracksPage() {
  await requireAdmin()

  const supabase = await createClient()
  const [albumsResult, tracksResult, annotationsResult] = await Promise.all([
    supabase
      .from('albums')
      .select('*')
      .order('release_date', { ascending: false, nullsFirst: false }),
    supabase
      .from('tracks')
      .select('*')
      .order('album_id')
      .order('track_number', { nullsFirst: false }),
    supabase.from('annotations').select('track_id'),
  ])

  const albums = (albumsResult.data ?? []) as Album[]
  const tracks = (tracksResult.data ?? []) as Track[]
  const albumTitles = new Map(albums.map((album) => [album.id, album.title]))

  const annotationCounts = new Map<string, number>()
  for (const row of (annotationsResult.data ?? []) as { track_id: string }[]) {
    annotationCounts.set(row.track_id, (annotationCounts.get(row.track_id) ?? 0) + 1)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-ink">Tracks</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {tracks.length} track{tracks.length === 1 ? '' : 's'},{' '}
          {tracks.filter((track) => !track.published).length} still in draft.
        </p>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-4 text-lg font-bold text-ink">All tracks</h2>

        {tracks.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing written down yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {tracks.map((track) => {
              const annotations = annotationCounts.get(track.id) ?? 0
              return (
                <li key={track.id}>
                  <Link
                    href={`/admin/tracks/${track.id}`}
                    className="flex items-center justify-between gap-4 rounded px-2 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {track.title}
                      </span>
                      <span className="block truncate text-xs text-ink-faint">
                        {[
                          albumTitles.get(track.album_id) ?? 'Unfiled',
                          formatDuration(track.duration_seconds),
                          annotations > 0 &&
                            `${annotations} annotation${annotations === 1 ? '' : 's'}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        track.published
                          ? 'bg-accent/15 text-accent'
                          : 'bg-surface-3 text-ink-muted'
                      }`}
                    >
                      {track.published ? 'Live' : 'Draft'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-1 text-lg font-bold text-ink">New track</h2>
        {albums.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-ink-muted">
              Creating a track opens its editor, where the lyrics live.
            </p>
            <NewTrackForm albums={albums} />
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Every track belongs to a release.{' '}
            <Link
              href="/admin/albums"
              className="font-bold text-accent underline-offset-4 hover:underline"
            >
              Create an album first
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  )
}
