import type { MetadataRoute } from 'next'
import { getAllAlbumSlugs, getAllTrackSlugs, getArtist } from '@/lib/queries'

/** Trailing slashes would double up when joined with a path. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  .replace(/\/+$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artist, albumSlugs, trackSlugs] = await Promise.all([
    getArtist(),
    getAllAlbumSlugs(),
    getAllTrackSlugs(),
  ])

  const lastModified = new Date()

  // Unpublished tracks are already filtered out by getAllTrackSlugs.
  const artistEntry: MetadataRoute.Sitemap = artist
    ? [
        {
          url: `${SITE_URL}/artist/${artist.slug}`,
          lastModified,
          changeFrequency: 'monthly',
          priority: 0.8,
        },
      ]
    : []

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...artistEntry,
    ...albumSlugs.map((slug) => ({
      url: `${SITE_URL}/album/${slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...trackSlugs.map((slug) => ({
      url: `${SITE_URL}/lyrics/${slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
