import type { Annotation } from './database.types'

export interface LyricSegment {
  text: string
  annotation: Annotation | null
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
 * Splits lyrics into a flat run of segments, each either plain text or text
 * covered by one annotation.
 *
 * Annotations that no longer match their quote are dropped, as are ones that
 * overlap an earlier annotation — the markup is a flat sequence of spans, so
 * a character can only belong to one of them. Earlier-starting annotations
 * win; ties go to the longer span.
 */
export function segmentLyrics(
  lyrics: string,
  annotations: Annotation[]
): LyricSegment[] {
  const anchored = annotations
    .filter((a) => isAnchored(lyrics, a))
    .sort((a, b) =>
      a.start_offset !== b.start_offset
        ? a.start_offset - b.start_offset
        : b.end_offset - a.end_offset
    )

  const segments: LyricSegment[] = []
  let cursor = 0

  for (const annotation of anchored) {
    if (annotation.start_offset < cursor) continue // overlaps one we kept

    if (annotation.start_offset > cursor) {
      segments.push({
        text: lyrics.slice(cursor, annotation.start_offset),
        annotation: null,
      })
    }

    segments.push({
      text: lyrics.slice(annotation.start_offset, annotation.end_offset),
      annotation,
    })
    cursor = annotation.end_offset
  }

  if (cursor < lyrics.length) {
    segments.push({ text: lyrics.slice(cursor), annotation: null })
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
