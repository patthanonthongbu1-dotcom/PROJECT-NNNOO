import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LyricsView } from '@/components/LyricsView'
import { ViewCounter } from '@/components/ViewCounter'
import { Editable, AdminOnly } from '@/components/edit/Editable'
import { EditOnly } from '@/components/edit/EditOnly'
import { TrackEditBar } from '@/components/edit/TrackEditBar'
import { DriftedNotes } from '@/components/edit/DriftedNotes'
import { InlineCredits } from '@/components/edit/InlineCredits'
import { getAllTrackSlugs, getTrackBySlug } from '@/lib/queries'
import { patchTrack } from '@/lib/actions'
import { toReaderAnnotations } from '@/lib/annotations'
import { formatDuration, formatViews } from '@/lib/format'
import type { Credit, CreditRole } from '@/lib/database.types'

export async function generateStaticParams() {
  const slugs = await getAllTrackSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  props: PageProps<'/lyrics/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const track = await getTrackBySlug(slug)
  if (!track) return {}

  return {
    title: `${track.title} — ${track.album.artist.name}`,
    description:
      track.about ??
      `Lyrics and credits for ${track.title} by ${track.album.artist.name}.`,
  }
}

export default async function LyricsPage(props: PageProps<'/lyrics/[slug]'>) {
  const { slug } = await props.params
  const track = await getTrackBySlug(slug)
  if (!track) notFound()

  const { album } = track
  const { artist } = album

  return (
    <article>
      <ViewCounter slug={track.slug} />

      <header className="flex flex-col gap-6 bg-gradient-to-b from-surface-3 to-transparent p-6 pt-12 sm:flex-row sm:items-end sm:p-8">
        {album.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.cover_url}
            alt=""
            width={160}
            height={160}
            fetchPriority="high"
            decoding="async"
            className="size-40 shrink-0 rounded object-cover shadow-2xl"
          />
        ) : (
          <div
            aria-hidden
            className="grid size-40 shrink-0 place-items-center rounded bg-surface-3 text-ink-faint shadow-2xl"
          >
            <svg viewBox="0 0 24 24" className="size-14 fill-current">
              <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="7" cy="18" r="2.5" />
              <circle cx="17" cy="16" r="2.5" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-muted">Lyrics</p>
          <div className="mt-2">
            <Editable
              action={patchTrack}
              id={track.id}
              field="title"
              value={track.title}
              label="Song title"
              className="text-4xl font-black sm:text-5xl lg:text-6xl"
            >
              <h1 className="text-4xl font-black break-words text-ink sm:text-5xl lg:text-6xl">
                {track.title}
              </h1>
            </Editable>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <Link
              href={`/artist/${artist.slug}`}
              className="font-bold text-ink hover:underline"
            >
              {artist.name}
            </Link>
            <span aria-hidden>·</span>
            <Link href={`/album/${album.slug}`} className="hover:underline">
              {album.title}
            </Link>
            {track.duration_seconds != null && (
              <>
                <span aria-hidden>·</span>
                <span>{formatDuration(track.duration_seconds)}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{formatViews(track.view_count)} reads</span>
          </p>
        </div>
      </header>

      <div className="p-6 sm:p-8">
        <AdminOnly>
          <EditOnly>
            <TrackEditBar
              trackId={track.id}
              trackTitle={track.title}
              published={track.published}
            />
            <DriftedNotes
              trackId={track.id}
              lyrics={track.lyrics}
              annotations={track.annotations}
            />
          </EditOnly>
        </AdminOnly>

        <LyricsView
          trackId={track.id}
          lyrics={track.lyrics}
          annotations={toReaderAnnotations(track.lyrics, track.annotations)}
        />

        <AboutSection about={track.about} trackId={track.id} />

        <Credits
          credits={track.credits}
          trackId={track.id}
        />
      </div>
    </article>
  )
}

/**
 * The note above the lyrics. Empty, it is nothing to a reader and an
 * invitation to an admin, which is why the whole section is gated rather
 * than just its text.
 */
function AboutSection({
  about,
  trackId,
}: {
  about: string | null
  trackId: string
}) {
  if (!about) {
    return (
      <AdminOnly>
        <EditOnly>
          <section className="mt-12 max-w-2xl">
            <h2 className="mb-3 text-2xl font-bold text-ink">About this song</h2>
            <Editable
              action={patchTrack}
              id={trackId}
              field="about"
              value=""
              label="About this song"
              multiline
              placeholder="Context, not commentary on a line."
            >
              <span />
            </Editable>
          </section>
        </EditOnly>
      </AdminOnly>
    )
  }

  return (
    <section className="mt-12 max-w-2xl">
      <h2 className="mb-3 text-2xl font-bold text-ink">About this song</h2>
      <Editable
        action={patchTrack}
        id={trackId}
        field="about"
        value={about}
        label="About this song"
        multiline
      >
        <p className="leading-relaxed whitespace-pre-wrap text-ink-muted">
          {about}
        </p>
      </Editable>
    </section>
  )
}

const ROLE_LABEL: Record<CreditRole, string> = {
  writer: 'Written by',
  producer: 'Produced by',
  feature: 'Featuring',
  mixing: 'Mixed by',
  mastering: 'Mastered by',
}

/**
 * Credits group by role so repeated roles read as one line, like a sleeve.
 *
 * The heading appears when there is either something to read or someone who
 * can add to it — an empty "Credits" heading is noise to everyone else.
 */
function Credits({ credits, trackId }: { credits: Credit[]; trackId: string }) {
  const grouped = new Map<CreditRole, string[]>()
  for (const credit of credits) {
    grouped.set(credit.role, [...(grouped.get(credit.role) ?? []), credit.name])
  }

  return (
    <section className="mt-12 max-w-2xl">
      {credits.length > 0 ? (
        <>
          <h2 className="mb-4 text-2xl font-bold text-ink">Credits</h2>
          <dl className="flex flex-col divide-y divide-line">
            {[...grouped].map(([role, names]) => (
              <div key={role} className="flex justify-between gap-4 py-3">
                <dt className="text-ink-muted">{ROLE_LABEL[role]}</dt>
                <dd className="text-right font-medium text-ink">
                  {names.join(', ')}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      <AdminOnly>
        <EditOnly>
          {credits.length === 0 && (
            <h2 className="mb-4 text-2xl font-bold text-ink">Credits</h2>
          )}
          <InlineCredits trackId={trackId} credits={credits} />
        </EditOnly>
      </AdminOnly>
    </section>
  )
}
