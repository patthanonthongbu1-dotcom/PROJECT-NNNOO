/**
 * Types mirroring supabase/migrations/0001_init.sql.
 *
 * Regenerate from a live project with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type AlbumType = 'album' | 'ep' | 'single'

export type CreditRole =
  | 'writer'
  | 'producer'
  | 'feature'
  | 'mixing'
  | 'mastering'

export interface Artist {
  id: string
  slug: string
  name: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  created_at: string
}

export interface Album {
  id: string
  artist_id: string
  slug: string
  title: string
  cover_url: string | null
  release_date: string | null
  album_type: AlbumType
  genres: string[]
  description: string | null
  created_at: string
}

export interface Track {
  id: string
  album_id: string
  slug: string
  title: string
  track_number: number | null
  duration_seconds: number | null
  lyrics: string
  about: string | null
  view_count: number
  published: boolean
  created_at: string
  updated_at: string
}

export interface Credit {
  id: string
  track_id: string
  role: CreditRole
  name: string
  position: number
}

export interface Annotation {
  id: string
  track_id: string
  start_offset: number
  end_offset: number
  quote: string
  body: string
  created_at: string
}

export interface Profile {
  id: string
  is_admin: boolean
  created_at: string
}

/** Shapes returned by the joined queries used across the app. */
export type AlbumWithArtist = Album & { artist: Artist }
export type AlbumWithTracks = Album & { tracks: Track[] }
export type TrackWithContext = Track & {
  album: Album & { artist: Artist }
  credits: Credit[]
  annotations: Annotation[]
}
