import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
import { TrackRow } from '@/components/TrackRow'
import { Editable, AdminOnly } from '@/components/edit/Editable'
import { EditOnly } from '@/components/edit/EditOnly'
import { getAlbumBySlug, getAllAlbumSlugs, getArtist } from '@/lib/queries'
import { patchAlbum } from '@/lib/actions'
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
        title={
          <Editable
            action={patchAlbum}
            id={album.id}
            field="title"
            value={album.title}
            label="Release title"
            className="text-4xl font-black sm:text-6xl lg:text-7xl"
          >
            <>{album.title}</>
          </Editable>
        }
        image={album.cover_url}
        imageEdit={{ action: patchAlbum, id: album.id, field: 'cover_url', folder: 'covers' }}
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
        <AdminOnly>
          <EditOnly>
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-card border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
              <label className="text-xs font-bold text-ink-muted" htmlFor={`release-${album.id}`}>
                Released
              </label>
              <Editable
                action={patchAlbum}
                id={album.id}
                field="release_date"
                value={album.release_date ?? ''}
                label="Release date"
                placeholder="YYYY-MM-DD"
                className="max-w-40 text-sm"
              >
                <span id={`release-${album.id}`} className="text-sm text-ink">
                  {album.release_date ? formatDate(album.release_date) : 'Not set'}
                </span>
              </Editable>

              <span className="flex-1" />

              <Link
                href={`/admin/albums/${album.id}`}
                className="text-sm font-bold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                Open in Studio
              </Link>
            </div>
          </EditOnly>
        </AdminOnly>

        <Genres album={album} />

        {album.description ? (
          <Editable
            action={patchAlbum}
            id={album.id}
            field="description"
            value={album.description}
            label="Release description"
            multiline
          >
            <p className="mb-8 max-w-2xl leading-relaxed text-ink-muted">
              {album.description}
            </p>
          </Editable>
        ) : (
          <AdminOnly>
            <EditOnly>
              <div className="mb-8 max-w-2xl">
                <Editable
                  action={patchAlbum}
                  id={album.id}
                  field="description"
                  value=""
                  label="Release description"
                  multiline
                  placeholder="What is this record about?"
                >
                  <span />
                </Editable>
              </div>
            </EditOnly>
          </AdminOnly>
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

        <AdminOnly>
          <EditOnly>
            <p className="mt-6 text-xs text-ink-faint">
              Adding a song, reordering the tracklist or changing the URL is
              Studio work — open a song to edit its words and notes in place.
            </p>
          </EditOnly>
        </AdminOnly>
      </div>
    </>
  )
}

/**
 * Genres read as pills and edit as the comma-separated list they are stored
 * as, which is the same trade the Studio form makes.
 */
function Genres({
  album,
}: {
  album: { id: string; genres: string[] }
}) {
  return (
    <>
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

      <AdminOnly>
        <EditOnly>
          <div className="mb-6 max-w-md">
            <Editable
              action={patchAlbum}
              id={album.id}
              field="genres"
              value={album.genres.join(', ')}
              label="Genres, comma separated"
              placeholder="alternative, bedroom pop"
              className="text-sm"
            >
              <span className="text-xs text-ink-faint">Genres</span>
            </Editable>
          </div>
        </EditOnly>
      </AdminOnly>
    </>
  )
}
