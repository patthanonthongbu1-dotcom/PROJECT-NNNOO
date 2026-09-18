import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AlbumCard } from '@/components/AlbumCard'
import { PageHeader } from '@/components/PageHeader'
import { Editable, AdminOnly } from '@/components/edit/Editable'
import { EditOnly } from '@/components/edit/EditOnly'
import { getAlbums, getArtistBySlug } from '@/lib/queries'
import { patchArtist } from '@/lib/actions'

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
  // Independent reads: the discography does not wait on the profile.
  const [artist, allAlbums] = await Promise.all([
    getArtistBySlug(slug),
    getAlbums(),
  ])
  if (!artist) notFound()

  const albums = allAlbums.filter((album) => album.artist_id === artist.id)

  return (
    <>
      <PageHeader
        eyebrow="Artist"
        title={
          <Editable
            action={patchArtist}
            id={artist.id}
            field="name"
            value={artist.name}
            label="Artist name"
            className="text-4xl font-black sm:text-6xl lg:text-7xl"
          >
            <>{artist.name}</>
          </Editable>
        }
        image={artist.avatar_url}
        imageEdit={{
          action: patchArtist,
          id: artist.id,
          field: 'avatar_url',
          folder: 'avatars',
        }}
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
        {artist.bio ? (
          <section className="mb-12 max-w-2xl">
            <h2 className="mb-3 text-2xl font-bold text-ink">About</h2>
            <Editable
              action={patchArtist}
              id={artist.id}
              field="bio"
              value={artist.bio}
              label="Artist biography"
              multiline
            >
              <p className="leading-relaxed whitespace-pre-wrap text-ink-muted">
                {artist.bio}
              </p>
            </Editable>
          </section>
        ) : (
          <AdminOnly>
            <EditOnly>
              <section className="mb-12 max-w-2xl">
                <h2 className="mb-3 text-2xl font-bold text-ink">About</h2>
                <Editable
                  action={patchArtist}
                  id={artist.id}
                  field="bio"
                  value=""
                  label="Artist biography"
                  multiline
                  placeholder="Who is making this?"
                >
                  <span />
                </Editable>
              </section>
            </EditOnly>
          </AdminOnly>
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
