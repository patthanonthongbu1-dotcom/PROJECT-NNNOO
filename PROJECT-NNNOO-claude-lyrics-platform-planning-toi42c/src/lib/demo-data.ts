import type {
  Album,
  Annotation,
  Artist,
  Credit,
  Track,
} from './database.types'

/**
 * Sample content used when no Supabase project is configured, so the site is
 * browsable straight after cloning. Everything here is invented placeholder
 * writing for a fictional artist — replace it with your own once the database
 * is wired up.
 */

const artist: Artist = {
  id: 'demo-artist',
  slug: 'paper-radio',
  name: 'Paper Radio',
  bio: "Bedroom recordings made between last trains. Two EPs, one long winter, and a borrowed condenser mic that hums in the key of D.",
  avatar_url: null,
  banner_url: null,
  created_at: '2024-01-01T00:00:00Z',
}

const albums: Album[] = [
  {
    id: 'demo-album-1',
    artist_id: artist.id,
    slug: 'low-ceiling-weather',
    title: 'Low Ceiling Weather',
    cover_url: null,
    release_date: '2025-03-14',
    album_type: 'album',
    genres: ['bedroom pop', 'indie'],
    description:
      'Written across one rainy season, mostly at the kitchen table after everyone had gone to bed.',
    created_at: '2025-03-14T00:00:00Z',
  },
  {
    id: 'demo-album-2',
    artist_id: artist.id,
    slug: 'static-garden',
    title: 'Static Garden',
    cover_url: null,
    release_date: '2024-08-02',
    album_type: 'ep',
    genres: ['lo-fi', 'dream pop'],
    description: 'Four songs about things left plugged in overnight.',
    created_at: '2024-08-02T00:00:00Z',
  },
]

const LYRICS: Record<string, string> = {
  'paper-walls': `[Verse 1]
I keep the radio low so the neighbours can sleep
Counting the cracks where the streetlight gets in
There's a map on the ceiling I drew with my eyes
Every road on it ends where the morning begins

[Chorus]
Paper walls, paper walls
I can hear you thinking through the paper walls
If you knock twice I'll know it's you
And I'll knock back, I always do

[Verse 2]
You said the city sounds different at four
Like it forgot that we're still listening in
I didn't answer, I just turned the dial
Till the static sounded almost like a friend`,

  'low-ceiling-weather': `[Verse 1]
Grey came down like a lid on a jar
Held the whole street at arm's length from the sun
I walked to the shop for a reason I'd lost
And came back with nothing and called it a run

[Chorus]
Low ceiling weather, low ceiling days
Everything's closer than I'd like it to be
The sky's just a room that I can't rearrange
So I'll sit here and let it sit on me`,

  'borrowed-mic': `[Verse 1]
It hums in the key of D when the fridge kicks in
So I wrote in D for a year and a half
Made a virtue of everything I couldn't fix
Made a chorus from a stranger's laugh

[Chorus]
Borrowed mic, borrowed time
Everything I own was somebody's first
I'll give it all back a little more worn
A little more honest, a little rehearsed`,

  'static-garden': `[Verse 1]
Left the amp on all night again
Woke to a room full of quiet noise
Something was growing in the empty channel
Something that sounded a lot like a voice

[Chorus]
Grow, static garden, grow
In the space where the signal used to be
I'll water you nightly with everything I meant
And couldn't say out loud to anybody`,

  'last-train-home': `[Verse 1]
Platform four and the board says delayed
I've got a coat and a head full of things I'd rewrite
You're asleep in a city an hour from here
And I'm rehearsing an apology to nobody tonight

[Chorus]
Last train home, last train home
Carry the version of me that tried
I'll be quieter when I get there
I'll have most of it worked out inside`,
}

const trackSeed: Array<{
  slug: string
  title: string
  album: string
  n: number
  seconds: number
  views: number
  about?: string
}> = [
  {
    slug: 'paper-walls',
    title: 'Paper Walls',
    album: 'demo-album-1',
    n: 1,
    seconds: 212,
    views: 14320,
    about:
      'The first thing written for the record, and the only one recorded in a single take.',
  },
  {
    slug: 'low-ceiling-weather',
    title: 'Low Ceiling Weather',
    album: 'demo-album-1',
    n: 2,
    seconds: 195,
    views: 9870,
    about: 'The title track. Three chords and a barometer.',
  },
  {
    slug: 'borrowed-mic',
    title: 'Borrowed Mic',
    album: 'demo-album-1',
    n: 3,
    seconds: 168,
    views: 5240,
  },
  {
    slug: 'static-garden',
    title: 'Static Garden',
    album: 'demo-album-2',
    n: 1,
    seconds: 241,
    views: 7710,
    about: 'Built from a recording of an amp left on overnight by accident.',
  },
  {
    slug: 'last-train-home',
    title: 'Last Train Home',
    album: 'demo-album-2',
    n: 2,
    seconds: 226,
    views: 18990,
  },
]

const tracks: Track[] = trackSeed.map((t, i) => ({
  id: `demo-track-${i + 1}`,
  album_id: t.album,
  slug: t.slug,
  title: t.title,
  track_number: t.n,
  duration_seconds: t.seconds,
  lyrics: LYRICS[t.slug],
  about: t.about ?? null,
  view_count: t.views,
  published: true,
  created_at: `2025-0${i + 1}-01T00:00:00Z`,
  updated_at: `2025-0${i + 1}-01T00:00:00Z`,
}))

const credits: Credit[] = [
  { id: 'c1', track_id: 'demo-track-1', role: 'writer', name: 'Paper Radio', position: 0 },
  { id: 'c2', track_id: 'demo-track-1', role: 'producer', name: 'Paper Radio', position: 1 },
  { id: 'c3', track_id: 'demo-track-1', role: 'mixing', name: 'J. Almond', position: 2 },
  { id: 'c4', track_id: 'demo-track-2', role: 'writer', name: 'Paper Radio', position: 0 },
  { id: 'c5', track_id: 'demo-track-2', role: 'producer', name: 'Paper Radio', position: 1 },
  { id: 'c6', track_id: 'demo-track-4', role: 'writer', name: 'Paper Radio', position: 0 },
  { id: 'c7', track_id: 'demo-track-4', role: 'feature', name: 'Wren Oyelaran', position: 1 },
  { id: 'c8', track_id: 'demo-track-5', role: 'writer', name: 'Paper Radio', position: 0 },
  { id: 'c9', track_id: 'demo-track-5', role: 'mastering', name: 'Studio Halcyon', position: 1 },
]

/**
 * Offsets are derived from the lyrics rather than written by hand, so the
 * demo annotations always satisfy the same quote check the real ones do.
 */
function annotate(
  id: string,
  trackId: string,
  quote: string,
  body: string
): Annotation {
  const lyrics = tracks.find((t) => t.id === trackId)!.lyrics
  const start = lyrics.indexOf(quote)
  if (start === -1) {
    throw new Error(`Demo annotation ${id} quotes text not present in ${trackId}`)
  }
  return {
    id,
    track_id: trackId,
    start_offset: start,
    end_offset: start + quote.length,
    quote,
    body,
    created_at: '2025-03-14T00:00:00Z',
  }
}

const annotations: Annotation[] = [
  annotate(
    'a1',
    'demo-track-1',
    "There's a map on the ceiling I drew with my eyes",
    'The ceiling map came from actually doing this as a kid — tracing the plaster cracks from bed and deciding they were roads somewhere. The verse keeps the childish logic and lets the chorus be the adult version of it.'
  ),
  annotate(
    'a2',
    'demo-track-1',
    "If you knock twice I'll know it's you",
    'Two knocks instead of one: the whole song in a gesture. Thin walls are usually a complaint, but here they are the only thing making contact possible.'
  ),
  annotate(
    'a3',
    'demo-track-2',
    "The sky's just a room that I can't rearrange",
    'The record keeps making weather into architecture — a lid, a ceiling, a room. This is the line where that finally gets said outright.'
  ),
  annotate(
    'a4',
    'demo-track-4',
    'Something that sounded a lot like a voice',
    'The amp really was left on overnight. What it picked up was almost certainly a taxi radio bleeding through the cable, but "almost certainly" is doing a lot of work.'
  ),
]

export const demoData = { artist, albums, tracks, credits, annotations }
