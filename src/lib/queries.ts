import { createClient } from './supabase/server'
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
 */

/** The site has one artist; whichever row exists is it. */
export async function getArtist(): Promise<Artist | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select('*')
    .order('created_at')
    .limit(1)
    .maybeSingle()
  return data
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return data
}

export async function getAlbums(): Promise<Album[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('albums')
    .select('*')
    .order('release_date', { ascending: false, nullsFirst: false })
  return data ?? []
}

export async function getAlbumBySlug(
  slug: string
): Promise<AlbumWithTracks | null> {
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
}

export async function getTrackBySlug(
  slug: string
): Promise<TrackWithContext | null> {
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
}

export async function getRecentTracks(limit = 10): Promise<Track[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getPopularTracks(limit = 10): Promise<Track[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tracks')
    .select('*')
    .order('view_count', { ascending: false })
    .limit(limit)
  return data ?? []
}

/** Slugs for static generation. */
export async function getAllAlbumSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('albums').select('slug')
  return (data ?? []).map((row) => row.slug as string)
}

export async function getAllTrackSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('tracks').select('slug').eq('published', true)
  return (data ?? []).map((row) => row.slug as string)
}

/**
 * Full-text search across track titles and lyrics.
 *
 * `websearch_to_tsquery` is the forgiving parser — it accepts quoted phrases
 * and bare words without throwing on punctuation the way plainto/tsquery can.
 */
export async function searchTracks(query: string): Promise<Track[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

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
}

/** Fire-and-forget counter bump; never blocks or fails a page render. */
export async function recordView(slug: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_view_count', { track_slug: slug })
}
