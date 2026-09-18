import { cache } from 'react'
import { createClient } from './supabase/server'
import { createStaticClient } from './supabase/static'
import { demoData } from './demo-data'
import type {
  Album,
  AlbumWithTracks,
  Artist,
  Track,
  TrackWithContext,
} from './database.types'

/**
 * Read helpers shared by the public pages.
 *
 * Everything here goes through the anon-key client under RLS, so unpublished
 * tracks are invisible unless the caller is signed in as an admin — the
 * filtering is the database's job, not these functions'.
 *
 * When no Supabase project is configured the same functions serve the sample
 * content in demo-data.ts instead, so a fresh clone renders without setup.
 * Every read path has a demo branch; the write paths in the admin panel do
 * not, and tell you to connect a database.
 *
 * Each reader is wrapped in React `cache`, which dedupes it for the lifetime
 * of one request. `generateMetadata` and the page body ask for the same track
 * on every lyrics view, and the shell asks for the artist and the albums that
 * the home page is asking for at the same moment — without this each of those
 * is two identical round trips.
 */

export const isDatabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/** The site has one artist; whichever row exists is it. */
export const getArtist = cache(async (): Promise<Artist | null> => {
  if (!isDatabaseConfigured) return demoData.artist

  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select('*')
    .order('created_at')
    .limit(1)
    .maybeSingle()
  return data
})

export const getArtistBySlug = cache(async (slug: string): Promise<Artist | null> => {
  if (!isDatabaseConfigured) {
    return demoData.artist.slug === slug ? demoData.artist : null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return data
})

export const getAlbums = cache(async (): Promise<Album[]> => {
  if (!isDatabaseConfigured) {
    return [...demoData.albums].sort((a, b) =>
      (b.release_date ?? '').localeCompare(a.release_date ?? '')
    )
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('albums')
    .select('*')
    .order('release_date', { ascending: false, nullsFirst: false })
  return data ?? []
})

export const getAlbumBySlug = cache(async (
  slug: string
): Promise<AlbumWithTracks | null> => {
  if (!isDatabaseConfigured) {
    const album = demoData.albums.find((a) => a.slug === slug)
    if (!album) return null
    return {
      ...album,
      tracks: demoData.tracks
        .filter((t) => t.album_id === album.id)
        .sort((a, b) => (a.track_number ?? 0) - (b.track_number ?? 0)),
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('albums')
    .select('*, tracks(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return null

  const album = data as AlbumWithTracks
  album.tracks.sort((a, b) => (a.track_number ?? 0) - (b.track_number ?? 0))
  return album
})

export const getTrackBySlug = cache(async (
  slug: string
): Promise<TrackWithContext | null> => {
  if (!isDatabaseConfigured) {
    const track = demoData.tracks.find((t) => t.slug === slug)
    if (!track) return null
    const album = demoData.albums.find((a) => a.id === track.album_id)!
    return {
      ...track,
      album: { ...album, artist: demoData.artist },
      credits: demoData.credits
        .filter((c) => c.track_id === track.id)
        .sort((a, b) => a.position - b.position),
      annotations: demoData.annotations.filter((a) => a.track_id === track.id),
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('tracks')
    .select('*, album:albums(*, artist:artists(*)), credits(*), annotations(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return null

  const track = data as TrackWithContext
  track.credits.sort((a, b) => a.position - b.position)
  return track
})

export const getRecentTracks = cache(async (limit = 10): Promise<Track[]> => {
  if (!isDatabaseConfigured) {
    return [...demoData.tracks]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
})

export const getPopularTracks = cache(async (limit = 10): Promise<Track[]> => {
  if (!isDatabaseConfigured) {
    return [...demoData.tracks]
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, limit)
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('tracks')
    .select('*')
    .order('view_count', { ascending: false })
    .limit(limit)
  return data ?? []
})

/** Slugs for static generation. */
export async function getAllAlbumSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured) return demoData.albums.map((a) => a.slug)

  // Cookie-less: this runs at build time, where cookies() would throw.
  const supabase = createStaticClient()
  const { data } = await supabase.from('albums').select('slug')
  return (data ?? []).map((row) => row.slug as string)
}

export async function getAllTrackSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured) {
    return demoData.tracks.filter((t) => t.published).map((t) => t.slug)
  }

  const supabase = createStaticClient()
  const { data } = await supabase
    .from('tracks')
    .select('slug')
    .eq('published', true)
  return (data ?? []).map((row) => row.slug as string)
}

/**
 * Full-text search across track titles and lyrics.
 *
 * `websearch_to_tsquery` is the forgiving parser — it accepts quoted phrases
 * and bare words without throwing on punctuation the way plainto/tsquery can.
 */
export const searchTracks = cache(async (query: string): Promise<Track[]> => {
  const trimmed = query.trim()
  if (!trimmed) return []

  if (!isDatabaseConfigured) {
    // Substring matching stands in for the tsvector index well enough to
    // demonstrate the page; the real query ranks and stems.
    const needle = trimmed.toLowerCase()
    return demoData.tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        t.lyrics.toLowerCase().includes(needle)
    )
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('tracks')
    .select('*')
    .textSearch('search_vector', trimmed, {
      type: 'websearch',
      config: 'simple',
    })
    .limit(50)
  return data ?? []
})

/** Fire-and-forget counter bump; never blocks or fails a page render. */
export async function recordView(slug: string): Promise<void> {
  if (!isDatabaseConfigured) return

  const supabase = await createClient()
  await supabase.rpc('increment_view_count', { track_slug: slug })
}
