/**
 * Turning a browser text selection into the character offsets the database
 * stores.
 *
 * This is the whole trick behind annotating from the public page: the lyric
 * container is rendered so that its text content is *exactly* the stored
 * `lyrics` string, and an offset is then simply how much text precedes the
 * point. Nothing else may be rendered inside that container — no annotation
 * numbers, no markers, no stray spaces — or every offset after the intruder
 * is wrong, and the only symptom is the server refusing a selection that
 * plainly does match.
 */

export interface SelectionRange {
  start: number
  end: number
  quote: string
}

/**
 * Offsets of the current selection within `container`, or null when there is
 * nothing usable to annotate.
 *
 * `Range.toString()` is load-bearing and `Selection.toString()` is not a
 * substitute: the former concatenates the data of the text nodes it covers,
 * exactly as `String.slice` sees them, while the latter is serialised from
 * layout and invents line breaks at block boundaries.
 */
export function offsetsFromSelection(
  container: HTMLElement,
  selection: Selection | null
): { start: number; end: number } | null {
  if (!selection || selection.rangeCount !== 1) return null

  const range = selection.getRangeAt(0)
  if (range.collapsed) return null

  // A drag that began in the page header is not a lyric selection. Without
  // this guard `setEnd` silently collapses the measuring range instead of
  // throwing, and the caller gets a plausible-looking wrong answer.
  if (
    !container.contains(range.startContainer) ||
    !container.contains(range.endContainer)
  ) {
    return null
  }

  const measure = range.cloneRange()
  measure.selectNodeContents(container)
  measure.setEnd(range.startContainer, range.startOffset)
  const start = measure.toString().length
  measure.setEnd(range.endContainer, range.endOffset)
  const end = measure.toString().length

  return end > start ? { start, end } : null
}

/**
 * Pulls a selection's edges in off any whitespace it swept up.
 *
 * Double-clicking a word usually takes the trailing space with it, and a
 * drag across lines takes the newlines. Neither belongs in a quote, and
 * leading whitespace in particular makes the highlight look misaligned.
 */
export function trimRange(
  lyrics: string,
  start: number,
  end: number
): SelectionRange | null {
  let from = start
  let to = end
  while (from < to && /\s/.test(lyrics[from])) from += 1
  while (to > from && /\s/.test(lyrics[to - 1])) to -= 1
  if (to <= from) return null

  return { start: from, end: to, quote: lyrics.slice(from, to) }
}

/** True when [start, end) touches any of the spans already on the lyrics. */
export function overlapsExisting(
  spans: { start_offset: number; end_offset: number }[],
  start: number,
  end: number
): boolean {
  return spans.some((span) => start < span.end_offset && end > span.start_offset)
}
