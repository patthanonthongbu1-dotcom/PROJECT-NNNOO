import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AlbumCard } from '@/components/AlbumCard'
import { PageHeader } from '@/components/PageHeader'
import { getAlbums, getArtistBySlug } from '@/lib/queries'

export async function generateMetadata(
  props: PageProps<'/artist/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const artist = await getArtistBySlug(slug)
  if (!artist) return {}

  return {
    title: artist.name,
    description: artist.bio ?? `Lyrics and credits by ${artist.name}.`,
  }
}

export default async function ArtistPage(props: PageProps<'/artist/[slug]'>) {
  const { slug } = await props.params
  const artist = await getArtistBySlug(slug)
  if (!artist) notFound()

  const albums = (await getAlbums()).filter((a) => a.artist_id === artist.id)

  return (
    <>
      <PageHeader
        eyebrow="Artist"
        title={artist.name}
        image={artist.avatar_url}
        rounded
        meta={
          albums.length > 0 && (
            <span>
              {albums.length} {albums.length === 1 ? 'release' : 'releases'}
            </span>
          )
        }
      />

      <div className="p-6 sm:p-8">
        {artist.bio && (
          <section className="mb-12 max-w-2xl">
            <h2 className="mb-3 text-2xl font-bold text-ink">About</h2>
            <p className="leading-relaxed whitespace-pre-wrap text-ink-muted">
              {artist.bio}
            </p>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-2xl font-bold text-ink">Discography</h2>
          {albums.length === 0 ? (
            <p className="text-ink-faint">No releases yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
