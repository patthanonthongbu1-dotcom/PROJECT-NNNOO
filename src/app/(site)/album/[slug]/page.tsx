import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
import { TrackRow } from '@/components/TrackRow'
import { getAlbumBySlug, getAllAlbumSlugs, getArtist } from '@/lib/queries'
import { albumTypeLabel, formatDate } from '@/lib/format'

export async function generateStaticParams() {
  const slugs = await getAllAlbumSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  props: PageProps<'/album/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const album = await getAlbumBySlug(slug)
  if (!album) return {}

  return {
    title: album.title,
    description:
      album.description ?? `${albumTypeLabel(album.album_type)} — ${album.title}`,
  }
}

export default async function AlbumPage(props: PageProps<'/album/[slug]'>) {
  const { slug } = await props.params
  const [album, artist] = await Promise.all([getAlbumBySlug(slug), getArtist()])
  if (!album) notFound()

  return (
    <>
      <PageHeader
        eyebrow={albumTypeLabel(album.album_type)}
        title={album.title}
        image={album.cover_url}
        meta={
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
            {artist && (
              <Link
                href={`/artist/${artist.slug}`}
                className="font-bold text-ink hover:underline"
              >
                {artist.name}
              </Link>
            )}
            {album.release_date && (
              <>
                <span aria-hidden>·</span>
                <span>{formatDate(album.release_date)}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>
              {album.tracks.length}{' '}
              {album.tracks.length === 1 ? 'song' : 'songs'}
            </span>
          </div>
        }
      />

      <div className="p-6 sm:p-8">
        {album.genres.length > 0 && (
          <ul className="mb-6 flex flex-wrap gap-2">
            {album.genres.map((genre) => (
              <li
                key={genre}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted"
              >
                {genre}
              </li>
            ))}
          </ul>
        )}

        {album.description && (
          <p className="mb-8 max-w-2xl leading-relaxed text-ink-muted">
            {album.description}
          </p>
        )}

        {album.tracks.length === 0 ? (
          <p className="text-ink-faint">No songs on this release yet.</p>
        ) : (
          <ol className="flex flex-col">
            {album.tracks.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} />
            ))}
          </ol>
        )}
      </div>
    </>
  )
}
