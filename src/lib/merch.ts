/**
 * Merch showcase. Nothing here is for sale -- it is a just-for-fun collection.
 * Items live in the `merch` table (edit them at /admin/merch); getMerch() in
 * queries.ts loads them. DEMO_MERCH is what shows when no database is set up.
 *
 * Everything in this file is plain data and pure functions, so client
 * components can import it too.
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
  id: string
  slug: string
  name: string
  type: MerchType
  status: MerchStatus
  /** ISO date (YYYY-MM-DD) for locked items; drives the countdown. null = TBA. */
  dropDate: string | null
  albumId: string | null
  /** Same slug the site uses in /album/<slug>. null = not paired yet. */
  albumSlug: string | null
  specs: {
    size: string
    finish: string
    printedBy: string
    released: string
    edition: string
  }
  colors: { headerTint: string; artBg: string }
  photos: MerchPhoto[]
  isLatestDrop: boolean
}

/** A row of the `merch` table, with its album's slug joined in. */
export interface MerchRow {
  id: string
  slug: string
  name: string
  type: MerchType
  status: MerchStatus
  drop_date: string | null
  album_id: string | null
  album: { slug: string } | null
  size: string
  finish: string
  printed_by: string
  released: string
  edition: string
  header_tint: string
  art_bg: string
  photos: MerchPhoto[]
  is_latest_drop: boolean
}

export const MERCH_TYPE_LABEL: Record<MerchType, string> = {
  bookmark: 'Bookmark',
  standee: 'Standee',
}

export function merchFromRow(row: MerchRow): MerchItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    status: row.status,
    dropDate: row.drop_date,
    albumId: row.album_id,
    albumSlug: row.album?.slug ?? null,
    specs: {
      size: row.size,
      finish: row.finish,
      printedBy: row.printed_by,
      released: row.released,
      edition: row.edition,
    },
    colors: { headerTint: row.header_tint, artBg: row.art_bg },
    photos: row.photos ?? [],
    isLatestDrop: row.is_latest_drop,
  }
}

export const DEMO_MERCH: MerchItem[] = [
  {
    id: 'demo-merch-1',
    slug: 'agtde-bookmark',
    name: "A Girl That Doesn't Exist: Bookmark",
    type: 'bookmark',
    status: 'collected',
    dropDate: null,
    albumId: null,
    albumSlug: 'a-girl-that-doesnt-exist',
    specs: {
      size: '5.5 × 16 cm',
      finish: '',
      printedBy: 'Master Photo',
      released: 'Nov 2026',
      edition: '18 copies (10 available)',
    },
    colors: { headerTint: '#FBE3EC', artBg: '#B04A66' },
    photos: [
      {
        src: '/images/merch/agtde-bookmark/front-and-back.png',
        alt: 'Front and back of a pink bookmark: the front shows a white-haired girl with glasses and a black mask reading a book, the back has white geometric patterns',
        label: 'Front & back',
      },
    ],
    isLatestDrop: true,
  },
]

export function getMerchBySlug(slug: string, items: MerchItem[]) {
  return items.find((item) => item.slug === slug) ?? null
}

export function getMerchForAlbum(albumSlug: string, items: MerchItem[]) {
  return items.filter((item) => item.albumSlug === albumSlug)
}

export function getLatestDrop(items: MerchItem[]) {
  return items.find((item) => item.isLatestDrop) ?? null
}

/** Items whose name or type contain any word of the query (case-insensitive). */
export function searchMerch(query: string, items: MerchItem[]) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  return items.filter((item) => {
    const haystack = `${item.name} ${MERCH_TYPE_LABEL[item.type]}`.toLowerCase()
    return terms.some((term) => haystack.includes(term))
  })
}

/** Everything except the latest drop, so the grid doesn't repeat it. */
export function getMoreMerch(items: MerchItem[]) {
  return items.filter((item) => !item.isLatestDrop)
}
