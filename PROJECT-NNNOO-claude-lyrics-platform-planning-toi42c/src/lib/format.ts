/** 214 -> "3:34". Returns an em dash when the duration is unknown. */
export function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** "2024-03-15" -> "2024". Release dates are shown as years in listings. */
export function releaseYear(date: string | null): string {
  if (!date) return ''
  return date.slice(0, 4)
}

/**
 * Built once, not per call — `toLocaleDateString` constructs a formatter
 * every time, and album pages render several dates.
 *
 * `timeZone: 'UTC'` is the important option. A `date` column arrives as
 * "2024-03-15", which `Date` parses as UTC midnight; rendering that in the
 * local zone shows the 14th to anyone west of Greenwich, and shows different
 * text on the server and in the browser, which is a hydration mismatch.
 */
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(date: string | null): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return DATE_FORMAT.format(parsed)
}

export function formatViews(count: number): string {
  if (count < 1000) return `${count}`
  if (count < 1_000_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

const ALBUM_TYPE_LABEL = { album: 'Album', ep: 'EP', single: 'Single' } as const

export function albumTypeLabel(type: keyof typeof ALBUM_TYPE_LABEL): string {
  return ALBUM_TYPE_LABEL[type] ?? 'Album'
}
