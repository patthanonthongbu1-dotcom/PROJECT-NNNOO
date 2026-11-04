/**
 * Merch showcase data. Nothing here is for sale -- it is a just-for-fun
 * collection, so it lives in code rather than the database. Edit this file to
 * add items; `[PLACEHOLDER]` marks info still to fill in.
 */

export type MerchType = 'bookmark' | 'standee'
export type MerchStatus = 'collected' | 'locked'

export interface MerchPhoto {
  src: string
  alt: string
  /** Short caption shown on the photo pill, e.g. "Banana for scale". */
  label: string
}

export interface MerchItem {
  slug: string
  name: string
  type: MerchType
  status: MerchStatus
  /** ISO date (YYYY-MM-DD) for locked items; drives the countdown. null = TBA. */
  dropDate: string | null
  /** Same slug the site uses in /album/<slug>. null = not paired yet. */
  albumSlug: string | null
  specs: {
    size: string
    finish: string
    printedBy: string
    released: string
    edition: string
  }
  /** Joke "lyrics" about the item. Line breaks are kept on the page. */
  lyrics: string
  story: string
  colors: { headerTint: string; artBg: string }
  photos: MerchPhoto[]
  isLatestDrop: boolean
}

export const MERCH_TYPE_LABEL: Record<MerchType, string> = {
  bookmark: 'Bookmark',
  standee: 'Standee',
}

export const MERCH: MerchItem[] = [
  {
    slug: 'clouds-bookmark-pink',
    name: 'Clouds Bookmark — Pink',
    type: 'bookmark',
    status: 'collected',
    dropDate: null,
    // [PLACEHOLDER] Summer Nights isn't on the live site yet; check this slug once it is.
    albumSlug: 'summer-nights',
    specs: {
      size: '[PLACEHOLDER]',
      finish: '[PLACEHOLDER]',
      printedBy: 'Master Photo',
      released: 'Nov 2026',
      edition: '[PLACEHOLDER]',
    },
    lyrics: `[PLACEHOLDER]
Pink like the sky at a quarter to eight
Holding my page so I don't have to wait`,
    story: '[PLACEHOLDER]',
    colors: { headerTint: '#FBE3EC', artBg: '#F48FB1' },
    photos: [
      {
        src: '/images/merch/clouds-bookmark-pink/hero.svg',
        alt: 'Pink Clouds bookmark lying flat, front side up',
        label: 'Hero shot',
      },
      {
        src: '/images/merch/clouds-bookmark-pink/scale.svg',
        alt: 'Pink Clouds bookmark next to a banana to show its size',
        label: 'Banana for scale',
      },
    ],
    isLatestDrop: true,
  },
  {
    slug: 'nnnoo-pattern-bookmark',
    name: 'nnnoo Pattern Bookmark',
    type: 'bookmark',
    status: 'collected',
    dropDate: null,
    albumSlug: 'a-girl-that-doesnt-exist',
    specs: {
      size: '[PLACEHOLDER]',
      finish: '[PLACEHOLDER]',
      printedBy: 'Master Photo',
      released: 'Nov 2026',
      edition: '[PLACEHOLDER]',
    },
    lyrics: `[PLACEHOLDER]
nnnoo nnnoo, all the way down
A pattern that never turns around`,
    story: '[PLACEHOLDER]',
    colors: { headerTint: '#E3EBF8', artBg: '#9DB6E0' },
    photos: [
      {
        src: '/images/merch/nnnoo-pattern-bookmark/hero.svg',
        alt: 'Blue nnnoo pattern bookmark lying flat, front side up',
        label: 'Hero shot',
      },
      {
        src: '/images/merch/nnnoo-pattern-bookmark/back.svg',
        alt: 'Back side of the nnnoo pattern bookmark',
        label: 'The back',
      },
    ],
    isLatestDrop: false,
  },
  {
    slug: 'clouds-acrylic-standee',
    name: 'Clouds Acrylic Standee',
    type: 'standee',
    status: 'locked',
    dropDate: null, // [DROP DATE] as YYYY-MM-DD
    albumSlug: null, // [ALBUM]
    specs: {
      size: '[PLACEHOLDER]',
      finish: '[PLACEHOLDER]',
      printedBy: '[PLACEHOLDER]',
      released: '[DROP DATE]',
      edition: '[PLACEHOLDER]',
    },
    lyrics: '[PLACEHOLDER]',
    story: '[PLACEHOLDER]',
    colors: { headerTint: '#FBE3EC', artBg: '#1E1E1E' },
    photos: [],
    isLatestDrop: false,
  },
]

export function getMerchBySlug(slug: string, items = MERCH) {
  return items.find((item) => item.slug === slug) ?? null
}

export function getMerchForAlbum(albumSlug: string, items = MERCH) {
  return items.filter((item) => item.albumSlug === albumSlug)
}

export function getLatestDrop(items = MERCH) {
  return items.find((item) => item.isLatestDrop) ?? null
}

/** Items whose name, type or lyrics contain any word of the query (case-insensitive). */
export function searchMerch(query: string, items = MERCH) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  return items.filter((item) => {
    const haystack = `${item.name} ${MERCH_TYPE_LABEL[item.type]} ${item.lyrics}`.toLowerCase()
    return terms.some((term) => haystack.includes(term))
  })
}

/** Everything except the latest drop, so the grid doesn't repeat it. */
export function getMoreMerch(items = MERCH) {
  return items.filter((item) => !item.isLatestDrop)
}
