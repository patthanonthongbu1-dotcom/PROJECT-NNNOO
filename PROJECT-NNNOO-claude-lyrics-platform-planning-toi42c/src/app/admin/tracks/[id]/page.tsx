import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { deleteTrack, toggleTrackPublished } from '@/lib/actions'
import { TrackEditor } from '@/components/admin/TrackEditor'
import { ActionButton } from '@/components/admin/ActionButton'
import { OpenInSiteLink } from '@/components/edit/OpenInSiteLink'
import type { Album, Annotation, Credit, Track } from '@/lib/database.types'

export async function generateMetadata({ params }: PageProps<'/admin/tracks/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('tracks').select('title').eq('id', id).maybeSingle()
  return { title: data?.title ?? 'Track' }
}

export default async function AdminTrackPage({
  params,
}: PageProps<'/admin/tracks/[id]'>) {
  await requireAdmin()
  const { id } = await params

  const supabase = await createClient()
  const [trackResult, albumsResult, creditsResult, annotationsResult] =
    await Promise.all([
      supabase.from('tracks').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('albums')
        .select('*')
        .order('release_date', { ascending: false, nullsFirst: false }),
      supabase.from('credits').select('*').eq('track_id', id).order('position'),
      supabase
        .from('annotations')
        .select('*')
        .eq('track_id', id)
        .order('start_offset'),
    ])

  if (!trackResult.data) notFound()

  const track = trackResult.data as Track
  const albums = (albumsResult.data ?? []) as Album[]
  const credits = (creditsResult.data ?? []) as Credit[]
  const annotations = (annotationsResult.data ?? []) as Annotation[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/tracks"
          className="text-sm font-bold text-ink-muted transition-colors hover:text-ink"
        >
          ← Tracks
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-ink">{track.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {track.published ? (
                <Link
                  href={`/lyrics/${track.slug}`}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  /lyrics/{track.slug}
                </Link>
              ) : (
                <>Draft — will live at /lyrics/{track.slug}</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* The words, the notes and the credits are quicker to edit on
                the page they appear on; this is the door to it. */}
            <OpenInSiteLink href={`/lyrics/${track.slug}`}>
              Edit on the page
            </OpenInSiteLink>

            <ActionButton
              action={toggleTrackPublished}
              fields={{ id: track.id }}
              variant={track.published ? 'secondary' : 'primary'}
              pendingLabel="Updating…"
            >
              {track.published ? 'Unpublish' : 'Publish'}
            </ActionButton>
          </div>
        </div>
      </div>

      <TrackEditor
        track={track}
        albums={albums}
        credits={credits}
        annotations={annotations}
      />

      <section className="rounded-card border border-red-950 bg-surface p-5">
        <h2 className="text-lg font-bold text-ink">Danger zone</h2>
        <p className="mt-1 mb-4 text-sm text-ink-muted">
          Deleting the track takes its credits and annotations with it.
        </p>
        <ActionButton
          action={deleteTrack}
          fields={{ id: track.id }}
          variant="danger"
          pendingLabel="Deleting…"
          confirm={`Delete "${track.title}"? This cannot be undone.`}
        >
          Delete track
        </ActionButton>
      </section>
    </div>
  )
}
