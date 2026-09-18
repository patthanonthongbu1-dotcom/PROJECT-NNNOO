import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Album, Artist, Track } from '@/lib/database.types'

export default async function AdminDashboard() {
  await requireAdmin()

  const supabase = await createClient()
  const [artistResult, albumsResult, tracksResult, annotationsResult] =
    await Promise.all([
      supabase.from('artists').select('*').order('created_at').limit(1).maybeSingle(),
      supabase.from('albums').select('*').order('release_date', {
        ascending: false,
        nullsFirst: false,
      }),
      supabase.from('tracks').select('*').order('updated_at', { ascending: false }),
      supabase.from('annotations').select('id', { count: 'exact', head: true }),
    ])

  const artist = artistResult.data as Artist | null
  const albums = (albumsResult.data ?? []) as Album[]
  const tracks = (tracksResult.data ?? []) as Track[]
  const drafts = tracks.filter((track) => !track.published)
  const albumTitles = new Map(albums.map((album) => [album.id, album.title]))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-ink">Dashboard</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {artist
            ? `Managing ${artist.name}.`
            : 'No artist profile yet — start there.'}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Albums" value={albums.length} />
        <Stat label="Tracks" value={tracks.length} />
        <Stat label="Published" value={tracks.length - drafts.length} />
        <Stat label="Annotations" value={annotationsResult.count ?? 0} />
      </dl>

      <section className="rounded-card border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Drafts</h2>
          <Link
            href="/admin/tracks"
            className="text-sm font-bold text-accent underline-offset-4 hover:underline"
          >
            All tracks
          </Link>
        </div>

        {drafts.length === 0 ? (
          <p className="text-sm text-ink-faint">
            Nothing unpublished. {tracks.length === 0 && 'No tracks yet, either.'}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {drafts.map((track) => (
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
                      {albumTitles.get(track.album_id) ?? 'Unfiled'}
                      {track.lyrics.trim() === '' && ' · no lyrics yet'}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-3 px-3 py-1 text-xs font-bold text-ink-muted">
                    Draft
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-4 text-lg font-bold text-ink">Quick links</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <QuickLink
            href="/admin/artist"
            title={artist ? 'Edit artist' : 'Create artist'}
            body="Name, bio, avatar and banner."
          />
          <QuickLink
            href="/admin/albums"
            title="Albums"
            body="Covers, release dates, genres."
          />
          <QuickLink
            href="/admin/tracks"
            title="Tracks"
            body="Lyrics, credits, annotations."
          />
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <dt className="text-xs font-bold tracking-wide text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-3xl font-black tabular-nums text-ink">{value}</dd>
    </div>
  )
}

function QuickLink({
  href,
  title,
  body,
}: {
  href: string
  title: string
  body: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="block h-full rounded border border-line bg-surface-2 p-4 transition-colors hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="block font-bold text-ink">{title}</span>
        <span className="mt-1 block text-sm text-ink-muted">{body}</span>
      </Link>
    </li>
  )
}
