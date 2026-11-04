import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CoverArt } from '@/components/CoverArt'
import { MerchPlayer } from '@/components/MerchPlayer'
import { getAlbumBySlug } from '@/lib/queries'
import { albumTypeLabel } from '@/lib/format'
import { MERCH, getMerchBySlug } from '@/lib/merch'

export function generateStaticParams() {
  return MERCH.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata(props: PageProps<'/merch/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const item = getMerchBySlug(slug)
  if (!item) return {}
  return { title: `${item.name} · Merch`, description: `${item.name}, nnnoo merch. Not for sale.` }
}

export default async function MerchItemPage(props: PageProps<'/merch/[slug]'>) {
  const { slug } = await props.params
  const item = getMerchBySlug(slug)
  if (!item) notFound()

  const i = MERCH.indexOf(item)
  const n = MERCH.length
  const album = item.albumSlug ? await getAlbumBySlug(item.albumSlug) : null

  const notes: [string, string][] = [
    ['Designed by', 'nnnoo'],
    ['Printed by', item.specs.printedBy],
    ['Size', item.specs.size],
    ['Finish', item.specs.finish],
    ['Released', item.specs.released],
    ['Edition', item.specs.edition],
  ]

  return (
    <div className="min-h-dvh bg-merch-bg text-merch-ink">
      <MerchPlayer
        key={item.slug}
        item={item}
        position={i + 1}
        total={n}
        prevSlug={MERCH[(i - 1 + n) % n].slug}
        nextSlug={MERCH[(i + 1) % n].slug}
        otherSlugs={MERCH.filter((m) => m !== item).map((m) => m.slug)}
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-8 sm:px-8">
        <section className="rounded-merch bg-merch-pink p-6">
          <h2 className="text-xl font-extrabold text-merch-ink">Lyrics</h2>
          <p className="mt-4 text-xl leading-relaxed font-bold whitespace-pre-line text-merch-ink">
            {item.lyrics}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-extrabold">Liner notes</h2>
          <dl className="flex flex-col divide-y divide-black/10 rounded-merch bg-merch-surface px-5">
            {notes.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3">
                <dt className="text-merch-muted">{label}</dt>
                <dd className="text-right font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-6 font-bold">The story</h3>
          <p className="mt-2 leading-relaxed whitespace-pre-line text-merch-muted">{item.story}</p>
        </section>

        {album && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold">Pairs well with</h2>
            <Link
              href={`/album/${album.slug}`}
              className="flex min-h-11 items-center gap-4 rounded-merch bg-merch-surface p-3 transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-merch-ink"
            >
              <CoverArt src={album.cover_url} className="size-16 rounded-[6px]" />
              <span className="min-w-0">
                <span className="block truncate font-bold">{album.title}</span>
                <span className="block text-sm text-merch-muted">
                  {albumTypeLabel(album.album_type)} · nnnoo
                </span>
              </span>
            </Link>
          </section>
        )}

        {item.photos.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold">Photo dump</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {item.photos.map((photo) => (
                <li key={photo.src}>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className="aspect-square w-full rounded-merch object-cover"
                      style={{ backgroundColor: item.colors.artBg }}
                    />
                    <figcaption className="mt-1 text-sm text-merch-muted">{photo.label}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
