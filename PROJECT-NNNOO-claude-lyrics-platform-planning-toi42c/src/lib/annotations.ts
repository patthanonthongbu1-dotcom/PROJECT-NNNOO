import type { Annotation } from './database.types'

/**
 * The shape the reader needs: where the note sits and what it says.
 *
 * Deliberately narrower than `Annotation`. The `quote` column duplicates a
 * substring of the lyrics the page is already sending, and `track_id` /
 * `created_at` are never rendered — on a heavily annotated song, shipping the
 * full rows roughly doubles the payload for no benefit.
 */
export interface ReaderAnnotation {
  id: string
  start_offset: number
  end_offset: number
  body: string
}

/** Anything with offsets can be laid over the lyrics. */
type Span = { start_offset: number; end_offset: number }

export interface LyricSegment<T extends Span = ReaderAnnotation> {
  /** Absolute character offset of this segment's first character. */
  start: number
  text: string
  annotation: T | null
}

/**
 * An annotation still points at the text it was written about when the
 * characters at its offsets match the quote captured at the time. If the
 * lyrics were edited, offsets shift and this comparison fails, which is how
 * we avoid highlighting the wrong words.
 */
export function isAnchored(lyrics: string, annotation: Annotation): boolean {
  return lyrics.slice(annotation.start_offset, annotation.end_offset) === annotation.quote
}

/**
 * Strips stored annotations down to the ones that still anchor, in the shape
 * the reader renders. Runs on the server, where the quotes already are.
 */
export function toReaderAnnotations(
  lyrics: string,
  annotations: Annotation[]
): ReaderAnnotation[] {
  return annotations
    .filter((annotation) => isAnchored(lyrics, annotation))
    .map(({ id, start_offset, end_offset, body }) => ({
      id,
      start_offset,
      end_offset,
      body,
    }))
}

/**
 * Splits lyrics into a flat run of segments, each either plain text or text
 * covered by one annotation.
 *
 * Annotations that overlap an earlier annotation are dropped — the markup is
 * a flat sequence of spans, so a character can only belong to one of them.
 * Earlier-starting annotations win; ties go to the longer span.
 */
export function segmentLyrics<T extends Span>(
  lyrics: string,
  annotations: T[]
): LyricSegment<T>[] {
  const ordered = [...annotations].sort((a, b) =>
    a.start_offset !== b.start_offset
      ? a.start_offset - b.start_offset
      : b.end_offset - a.end_offset
  )

  const segments: LyricSegment<T>[] = []
  let cursor = 0

  for (const annotation of ordered) {
    if (annotation.start_offset < cursor) continue // overlaps one we kept
    if (annotation.start_offset >= lyrics.length) continue

    if (annotation.start_offset > cursor) {
      segments.push({
        start: cursor,
        text: lyrics.slice(cursor, annotation.start_offset),
        annotation: null,
      })
    }

    segments.push({
      start: annotation.start_offset,
      text: lyrics.slice(annotation.start_offset, annotation.end_offset),
      annotation,
    })
    cursor = annotation.end_offset
  }

  if (cursor < lyrics.length) {
    segments.push({ start: cursor, text: lyrics.slice(cursor), annotation: null })
  }

  return segments
}

/** Annotations that have come unstuck from the lyrics and need re-anchoring. */
export function findDriftedAnnotations(
  lyrics: string,
  annotations: Annotation[]
): Annotation[] {
  return annotations.filter((a) => !isAnchored(lyrics, a))
}

/**
 * Re-anchors a drifted annotation by searching for its quote in the edited
 * lyrics. Returns null when the quote is gone or appears more than once,
 * since guessing between matches would silently move the annotation.
 */
export function reanchor(
  lyrics: string,
  annotation: Annotation
): { start_offset: number; end_offset: number } | null {
  const first = lyrics.indexOf(annotation.quote)
  if (first === -1) return null
  if (lyrics.indexOf(annotation.quote, first + 1) !== -1) return null

  return { start_offset: first, end_offset: first + annotation.quote.length }
}

/** `[Chorus]`-style section markers get their own styling when rendered. */
export function isSectionHeader(line: string): boolean {
  return /^\s*\[.+\]\s*$/.test(line)
}

/**
 * The lyrics as the DOM will hold them.
 *
 * The HTML parser normalises `\r\n` to `\n` inside text nodes, so a row that
 * ever picked up Windows line endings — pasted through the Supabase dashboard,
 * say — would be one character shorter in the browser than in the database.
 * Every offset measured from a selection would then be wrong, and the only
 * symptom would be `createAnnotation` refusing a selection that plainly does
 * match. Normalising on write keeps the two strings identical.
 */
export function normalizeNewlines(lyrics: string): string {
  return lyrics.replace(/\r\n?/g, '\n')
}
