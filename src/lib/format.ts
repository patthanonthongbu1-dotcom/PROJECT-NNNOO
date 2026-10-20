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

export function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatViews(count: number): string {
  if (count < 1000) return `${count}`
  if (count < 1_000_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

/**
 * Plain text -> blocks: blank lines separate paragraphs, and a line that is
 * wholly `[Like This]` becomes a heading — the same convention as lyrics.
 */
export type ProseBlock = { kind: 'heading' | 'paragraph'; text: string }

export function parseProse(text: string): ProseBlock[] {
  const blocks: ProseBlock[] = []
  for (const chunk of text.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lines = chunk.split('\n')
    const heading = /^\[(.+)\]$/.exec(lines[0].trim())
    if (heading) {
      blocks.push({ kind: 'heading', text: heading[1] })
      lines.shift()
    }
    const rest = lines.join('\n').trim()
    if (rest) blocks.push({ kind: 'paragraph', text: rest })
  }
  return blocks
}

/** Releases bucketed by year, newest first; undated ones last under ''. */
export function groupByYear<T extends { release_date: string | null }>(
  items: T[]
): [string, T[]][] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const year = releaseYear(item.release_date)
    groups.set(year, [...(groups.get(year) ?? []), item])
  }
  return [...groups].sort(([a], [b]) => (a && b ? b.localeCompare(a) : a ? -1 : 1))
}

const ALBUM_TYPE_LABEL = { album: 'Album', ep: 'EP', single: 'Single' } as const

export function albumTypeLabel(type: keyof typeof ALBUM_TYPE_LABEL): string {
  return ALBUM_TYPE_LABEL[type] ?? 'Album'
}
