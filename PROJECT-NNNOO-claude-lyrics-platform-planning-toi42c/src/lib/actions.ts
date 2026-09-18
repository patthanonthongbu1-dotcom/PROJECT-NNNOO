'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from './auth'
import { createClient } from './supabase/server'
import { isDatabaseConfigured } from './queries'
import { isAnchored, normalizeNewlines, reanchor } from './annotations'
import type { Annotation } from './database.types'

/**
 * Every mutation in the admin section.
 *
 * Server Actions are reachable as plain POST endpoints whether or not the UI
 * that calls them was ever rendered, so each one starts with `requireAdmin()`
 * — the proxy's redirect is a convenience, not a boundary. RLS is the third
 * layer: even a leaked action call writes nothing without `is_admin()`.
 */

export interface ActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  /** Keyed by form field name, for inline messages next to the input. */
  fieldErrors?: Record<string, string>
}

export interface UploadState extends ActionState {
  url?: string
}

function fail(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { status: 'error', message, fieldErrors }
}

function ok(message: string): ActionState {
  return { status: 'success', message }
}

/**
 * Demo mode has no database to write to and no auth server to ask, so
 * `requireAdmin()` would bounce the caller to a login page that cannot sign
 * anyone in. Saying so is friendlier than a redirect into a dead end.
 *
 * Every action still calls `requireAdmin()` immediately after this — nothing
 * is written either way, so the order costs no safety.
 */
function demoModeRefusal(): ActionState | null {
  return isDatabaseConfigured
    ? null
    : fail('Connect a Supabase project to save changes.')
}

// ------------------------------------------------------------------ parsing

function text(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/** Empty inputs are absent values, not empty strings — the columns are nullable. */
function nullableText(form: FormData, key: string): string | null {
  const value = text(form, key)
  return value === '' ? null : value
}

function nullableInt(form: FormData, key: string): number | null {
  const value = text(form, key)
  if (value === '') return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

/** Accepts either `214` or `3:34`, because both are natural to type. */
function parseDuration(raw: string): number | null {
  if (raw === '') return null
  const clock = /^(\d+):([0-5]\d)$/.exec(raw)
  if (clock) return Number(clock[1]) * 60 + Number(clock[2])
  const seconds = Number.parseInt(raw, 10)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

function parseGenres(raw: string): string[] {
  return raw
    .split(',')
    .map((genre) => genre.trim())
    .filter(Boolean)
}

/**
 * "Sí, Cómo No? (Live)" -> "si-como-no-live".
 *
 * NFD splits accented characters into a base letter plus a combining mark,
 * so stripping the marks leaves plain ASCII behind instead of dropping the
 * whole letter.
 */
/**
 * Builds an update row from only the keys the form actually sent.
 *
 * This is the entire difference between the patch actions and the full-form
 * ones above: an inline editor on the public page renders one field, so it
 * posts one field, and everything it never showed has to survive the save
 * untouched. `form.has(key)` is the test that expresses it — a missing key
 * means "leave it alone", a present but empty one means "clear it".
 */
const INVALID = Symbol('invalid')
type Parse = (form: FormData, key: string) => unknown

interface PatchSpec {
  parse: Parse
  /** Shown next to the field when `parse` returns INVALID. */
  error?: string
}

function buildPatch(
  form: FormData,
  specs: Record<string, PatchSpec>
): { row: Record<string, unknown>; fieldErrors: Record<string, string> } {
  const row: Record<string, unknown> = {}
  const fieldErrors: Record<string, string> = {}

  for (const [key, spec] of Object.entries(specs)) {
    if (!form.has(key)) continue
    const value = spec.parse(form, key)
    if (value === INVALID) fieldErrors[key] = spec.error ?? 'Not valid.'
    else row[key] = value
  }

  return { row, fieldErrors }
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}

/** Postgres unique violation. */
function isSlugCollision(error: { code?: string; message?: string } | null): boolean {
  return error?.code === '23505' && (error.message ?? '').includes('slug')
}

function isTrackNumberCollision(error: { code?: string; message?: string } | null): boolean {
  return error?.code === '23505' && (error.message ?? '').includes('track_number')
}

/**
 * Inserts a row, retrying with a suffixed slug on collision.
 *
 * Generated slugs are a convenience, so a clash is resolved silently; slugs
 * the admin typed are reported back instead (see the update actions).
 */
async function insertWithSlug(
  table: 'albums' | 'tracks',
  row: Record<string, unknown>,
  baseSlug: string
) {
  const supabase = await createClient()
  const base = baseSlug || 'untitled'
  let slug = base

  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await supabase
      .from(table)
      .insert({ ...row, slug })
      .select('id, slug')
      .single()

    if (!result.error || !isSlugCollision(result.error)) return result
    slug = `${base}-${randomSuffix()}`
  }

  return {
    data: null,
    error: { code: '23505', message: 'Could not find a free URL slug — rename it.' },
  }
}

// ------------------------------------------------------------- revalidation

/** Routes that any content edit can change. */
function revalidateShared() {
  revalidatePath('/')
  revalidatePath('/search')
}

/**
 * `alsoSlugs` is how a renamed row stops serving a stale page: the slug is
 * read back *after* the update, so the path the content used to live at would
 * otherwise keep its cached copy forever. Callers that change a slug pass the
 * old one in.
 */
async function revalidateTrack(trackId: string, alsoSlugs: string[] = []) {
  const supabase = await createClient()
  // One join rather than two round trips — inline editing calls this on
  // every blur, so the second query is not free.
  const { data } = await supabase
    .from('tracks')
    .select('slug, album:albums(slug)')
    .eq('id', trackId)
    .maybeSingle()

  for (const slug of alsoSlugs) revalidatePath(`/lyrics/${slug}`)
  revalidatePath(`/admin/tracks/${trackId}`)
  revalidateShared()

  if (!data) return
  revalidatePath(`/lyrics/${data.slug}`)

  // Without generated database types, PostgREST embeds are inferred as
  // many-sided. `album_id` is a plain foreign key, so this is one row —
  // handled both ways rather than asserted, because a wrong guess here would
  // only show up as an album page that never refreshes.
  const embedded = data.album as unknown as
    | { slug: string }
    | { slug: string }[]
    | null
  const albumSlug = Array.isArray(embedded) ? embedded[0]?.slug : embedded?.slug
  if (albumSlug) revalidatePath(`/album/${albumSlug}`)
}

async function revalidateAlbum(albumId: string, alsoSlugs: string[] = []) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('albums')
    .select('slug')
    .eq('id', albumId)
    .maybeSingle()

  for (const slug of alsoSlugs) revalidatePath(`/album/${slug}`)
  revalidatePath(`/admin/albums/${albumId}`)
  if (data) revalidatePath(`/album/${data.slug}`)
}

// -------------------------------------------------------------------- auth

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/admin/login')
}

// ------------------------------------------------------------------ artist

/**
 * The site has exactly one artist, so this is an upsert against whichever
 * row exists rather than a create/update pair.
 */
export async function saveArtist(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const name = text(formData, 'name')
  if (!name) return fail('Name is required.', { name: 'Enter an artist name.' })

  const supabase = await createClient()
  const id = text(formData, 'id')
  const fields = {
    name,
    bio: nullableText(formData, 'bio'),
    avatar_url: nullableText(formData, 'avatar_url'),
    banner_url: nullableText(formData, 'banner_url'),
  }

  const slug = text(formData, 'slug') || slugify(name) || 'artist'

  const { error } = id
    ? await supabase.from('artists').update({ ...fields, slug }).eq('id', id)
    : await supabase.from('artists').insert({ ...fields, slug })

  if (error) {
    if (isSlugCollision(error)) {
      return fail('That URL slug is taken.', { slug: 'Already in use.' })
    }
    return fail(error.message)
  }

  revalidatePath(`/artist/${slug}`)
  revalidatePath('/admin/artist')
  revalidateShared()
  return ok('Artist saved.')
}

// ------------------------------------------------------------------ albums

function albumFields(formData: FormData) {
  return {
    title: text(formData, 'title'),
    description: nullableText(formData, 'description'),
    cover_url: nullableText(formData, 'cover_url'),
    release_date: nullableText(formData, 'release_date'),
    album_type: text(formData, 'album_type') || 'album',
    genres: parseGenres(text(formData, 'genres')),
  }
}

export async function createAlbum(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const fields = albumFields(formData)
  if (!fields.title) return fail('Title is required.', { title: 'Enter a title.' })

  const supabase = await createClient()
  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .order('created_at')
    .limit(1)
    .maybeSingle()

  if (!artist) {
    return fail('Create the artist profile before adding albums.')
  }

  const { data, error } = await insertWithSlug(
    'albums',
    { ...fields, artist_id: artist.id },
    slugify(fields.title)
  )

  if (error || !data) return fail(error?.message ?? 'Could not create the album.')

  revalidatePath('/admin/albums')
  revalidateShared()
  redirect(`/admin/albums/${data.id}`)
}

/**
 * Releases a single: one track, and the one-track release that holds it.
 *
 * The schema requires every track to belong to an album, which is right for
 * queries but makes releasing one song a two-step chore. This does both in
 * one go, titling the release after the track and numbering it 1.
 *
 * If the track insert fails the release is deleted again, so a half-finished
 * single never leaves an empty release sitting in the discography.
 */
export async function createSingle(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const title = text(formData, 'title')
  if (!title) return fail('Title is required.', { title: 'Enter a title.' })

  const supabase = await createClient()
  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .order('created_at')
    .limit(1)
    .maybeSingle()

  if (!artist) {
    return fail('Create the artist profile before releasing a single.')
  }

  const { data: album, error: albumError } = await insertWithSlug(
    'albums',
    {
      artist_id: artist.id,
      title,
      album_type: 'single',
      release_date: text(formData, 'release_date') || null,
    },
    slugify(title)
  )

  if (albumError || !album) {
    return fail(albumError?.message ?? 'Could not create the single.')
  }

  const { data: track, error: trackError } = await insertWithSlug(
    'tracks',
    { album_id: album.id, title, track_number: 1 },
    slugify(title)
  )

  if (trackError || !track) {
    await supabase.from('albums').delete().eq('id', album.id)
    return fail(trackError?.message ?? 'Could not create the single.')
  }

  revalidatePath('/admin/albums')
  revalidatePath('/admin/tracks')
  revalidateShared()
  redirect(`/admin/tracks/${track.id}`)
}

export async function updateAlbum(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return fail('Missing album id.')

  const fields = albumFields(formData)
  if (!fields.title) return fail('Title is required.', { title: 'Enter a title.' })

  const slug = text(formData, 'slug') || slugify(fields.title)
  const supabase = await createClient()
  const { data: previous } = await supabase
    .from('albums')
    .select('slug')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase
    .from('albums')
    .update({ ...fields, slug })
    .eq('id', id)

  if (error) {
    if (isSlugCollision(error)) {
      return fail('That URL slug is taken.', { slug: 'Already in use.' })
    }
    return fail(error.message)
  }

  await revalidateAlbum(id, previous ? [previous.slug] : [])
  revalidatePath('/admin/albums')
  revalidateShared()
  return ok('Album saved.')
}

export async function deleteAlbum(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return fail('Missing album id.')

  const supabase = await createClient()
  const { data: album } = await supabase
    .from('albums')
    .select('slug')
    .eq('id', id)
    .maybeSingle()

  // Tracks, credits and annotations go with it — the foreign keys cascade.
  const { error } = await supabase.from('albums').delete().eq('id', id)
  if (error) return fail(error.message)

  if (album) revalidatePath(`/album/${album.slug}`)
  revalidatePath('/admin/albums')
  revalidateShared()
  redirect('/admin/albums')
}

// ------------------------------------------------------------------ tracks

export async function createTrack(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const title = text(formData, 'title')
  const albumId = text(formData, 'album_id')
  if (!title) return fail('Title is required.', { title: 'Enter a title.' })
  if (!albumId) return fail('Pick an album.', { album_id: 'Pick an album.' })

  const { data, error } = await insertWithSlug(
    'tracks',
    {
      album_id: albumId,
      title,
      track_number: nullableInt(formData, 'track_number'),
    },
    slugify(title)
  )

  if (error || !data) {
    if (isTrackNumberCollision(error)) {
      return fail('That track number is already used on this album.', {
        track_number: 'Already used on this album.',
      })
    }
    return fail(error?.message ?? 'Could not create the track.')
  }

  revalidatePath('/admin/tracks')
  revalidateShared()
  redirect(`/admin/tracks/${data.id}`)
}

export async function updateTrack(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return fail('Missing track id.')

  const title = text(formData, 'title')
  if (!title) return fail('Title is required.', { title: 'Enter a title.' })

  const rawDuration = text(formData, 'duration')
  const duration = parseDuration(rawDuration)
  if (rawDuration !== '' && duration === null) {
    return fail('Duration must be seconds or m:ss.', {
      duration: 'Use 214 or 3:34.',
    })
  }

  const slug = text(formData, 'slug') || slugify(title)
  const supabase = await createClient()
  const { data: previous } = await supabase
    .from('tracks')
    .select('slug')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase
    .from('tracks')
    .update({
      title,
      slug,
      album_id: text(formData, 'album_id'),
      track_number: nullableInt(formData, 'track_number'),
      duration_seconds: duration,
      lyrics: normalizeNewlines((formData.get('lyrics') as string | null) ?? ''),
      about: nullableText(formData, 'about'),
      published: formData.get('published') === 'on',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (isSlugCollision(error)) {
      return fail('That URL slug is taken.', { slug: 'Already in use.' })
    }
    if (isTrackNumberCollision(error)) {
      return fail('That track number is already used on this album.', {
        track_number: 'Already used on this album.',
      })
    }
    return fail(error.message)
  }

  await revalidateTrack(id, previous ? [previous.slug] : [])
  revalidatePath('/admin/tracks')
  return ok('Track saved.')
}

export async function toggleTrackPublished(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return fail('Missing track id.')

  const supabase = await createClient()
  const { data: track } = await supabase
    .from('tracks')
    .select('published')
    .eq('id', id)
    .maybeSingle()

  if (!track) return fail('Track not found.')

  const { error } = await supabase
    .from('tracks')
    .update({ published: !track.published, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return fail(error.message)

  await revalidateTrack(id)
  revalidatePath('/admin/tracks')
  return ok(track.published ? 'Moved back to drafts.' : 'Published.')
}

export async function deleteTrack(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return fail('Missing track id.')

  const supabase = await createClient()
  const { data: track } = await supabase
    .from('tracks')
    .select('slug, album_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('tracks').delete().eq('id', id)
  if (error) return fail(error.message)

  if (track) {
    revalidatePath(`/lyrics/${track.slug}`)
    await revalidateAlbum(track.album_id)
  }
  revalidatePath('/admin/tracks')
  revalidateShared()
  redirect('/admin/tracks')
}

// ----------------------------------------------------------------- credits

export async function addCredit(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const trackId = text(formData, 'track_id')
  const name = text(formData, 'name')
  const role = text(formData, 'role')
  if (!trackId) return fail('Missing track id.')
  if (!name) return fail('Name is required.', { name: 'Who gets the credit?' })
  if (!role) return fail('Pick a role.', { role: 'Pick a role.' })

  const supabase = await createClient()
  // Append: new credits sort after the existing ones.
  const { count } = await supabase
    .from('credits')
    .select('id', { count: 'exact', head: true })
    .eq('track_id', trackId)

  const { error } = await supabase
    .from('credits')
    .insert({ track_id: trackId, role, name, position: count ?? 0 })

  if (error) return fail(error.message)

  await revalidateTrack(trackId)
  return ok('Credit added.')
}

export async function removeCredit(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  const trackId = text(formData, 'track_id')
  if (!id) return fail('Missing credit id.')

  const supabase = await createClient()
  const { error } = await supabase.from('credits').delete().eq('id', id)
  if (error) return fail(error.message)

  if (trackId) await revalidateTrack(trackId)
  return ok('Credit removed.')
}

// -------------------------------------------------------------- annotations

export async function createAnnotation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const trackId = text(formData, 'track_id')
  const body = text(formData, 'body')
  const quote = (formData.get('quote') as string | null) ?? ''
  const start = nullableInt(formData, 'start_offset')
  const end = nullableInt(formData, 'end_offset')

  if (!trackId) return fail('Missing track id.')
  if (start === null || end === null || end <= start || quote === '') {
    return fail('Select some lyrics before annotating.')
  }
  if (!body) return fail('Write the annotation.', { body: 'Say something about it.' })

  const supabase = await createClient()

  // The selection came from the browser's copy of the textarea, which may be
  // ahead of what is saved. Anchoring against the stored lyrics keeps the
  // quote and the offsets describing the same row.
  const { data: track } = await supabase
    .from('tracks')
    .select('lyrics')
    .eq('id', trackId)
    .maybeSingle()

  if (!track) return fail('Track not found.')
  if (track.lyrics.slice(start, end) !== quote) {
    return fail('Save the lyrics first — the selection no longer matches what is stored.')
  }

  // The reader renders a flat run of spans, so a character can belong to only
  // one note; an overlapping one would be stored and then silently never
  // shown. Refusing here is the difference between "no" and nothing happening.
  const { data: existing } = await supabase
    .from('annotations')
    .select('*')
    .eq('track_id', trackId)

  const clash = ((existing ?? []) as Annotation[])
    .filter((annotation) => isAnchored(track.lyrics, annotation))
    .some((annotation) => start < annotation.end_offset && end > annotation.start_offset)

  if (clash) {
    return fail('Those words are already part of another note.')
  }

  const { error } = await supabase.from('annotations').insert({
    track_id: trackId,
    start_offset: start,
    end_offset: end,
    quote,
    body,
  })

  if (error) return fail(error.message)

  await revalidateTrack(trackId)
  return ok('Annotation added.')
}

/** Rewriting a note in place, from the panel on the public page. */
export async function updateAnnotation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  const trackId = text(formData, 'track_id')
  const body = text(formData, 'body')
  if (!id) return fail('Missing annotation id.')
  if (!body) return fail('Write the annotation.', { body: 'Say something about it.' })

  const supabase = await createClient()
  // Offsets and quote are left alone: this edits what the note says, never
  // where it points. Moving it is re-anchoring, which has its own action.
  const { error } = await supabase.from('annotations').update({ body }).eq('id', id)
  if (error) return fail(error.message)

  if (trackId) await revalidateTrack(trackId)
  return ok('Annotation saved.')
}

export async function deleteAnnotation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  const trackId = text(formData, 'track_id')
  if (!id) return fail('Missing annotation id.')

  const supabase = await createClient()
  const { error } = await supabase.from('annotations').delete().eq('id', id)
  if (error) return fail(error.message)

  if (trackId) await revalidateTrack(trackId)
  return ok('Annotation deleted.')
}

/**
 * Points a drifted annotation back at its quote in the edited lyrics.
 *
 * `reanchor` refuses when the quote is missing or ambiguous, and there is no
 * safe fallback — picking one of several matches would silently move the
 * note onto a different line — so the admin is asked to fix it by hand.
 */
export async function reanchorAnnotation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  const trackId = text(formData, 'track_id')
  if (!id || !trackId) return fail('Missing annotation id.')

  const supabase = await createClient()
  const [{ data: track }, { data: annotation }] = await Promise.all([
    supabase.from('tracks').select('lyrics').eq('id', trackId).maybeSingle(),
    supabase.from('annotations').select('*').eq('id', id).maybeSingle(),
  ])

  if (!track || !annotation) return fail('Annotation not found.')

  const offsets = reanchor(track.lyrics, annotation as Annotation)
  if (!offsets) {
    return fail(
      'Could not re-anchor: the quote is either gone from the lyrics or appears more than once.'
    )
  }

  const { error } = await supabase.from('annotations').update(offsets).eq('id', id)
  if (error) return fail(error.message)

  await revalidateTrack(trackId)
  return ok('Annotation re-anchored.')
}

// ------------------------------------------------------------------ patches
/*
 * Field-at-a-time edits made from the public pages, where the reader IS the
 * editor. The full-form actions above still own everything structural —
 * slugs, album membership, track numbers, creating and deleting rows — which
 * is what keeps the reading view a reading view and the Studio worth opening.
 */

/** id + any subset of: title, about, lyrics. */
export async function patchTrack(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return fail('Missing track id.')

  const { row, fieldErrors } = buildPatch(formData, {
    title: {
      parse: (form, key) => text(form, key) || INVALID,
      error: 'A song needs a title.',
    },
    about: { parse: nullableText },
    // Not trimmed: leading blank lines and trailing spaces are the writer's
    // business, and trimming would move every annotation offset after them.
    lyrics: {
      parse: (form, key) => normalizeNewlines((form.get(key) as string | null) ?? ''),
    },
  })

  if (Object.keys(fieldErrors).length > 0) {
    return fail('That change was not saved.', fieldErrors)
  }
  // PostgREST rejects an empty update, and there is nothing to say about one.
  if (Object.keys(row).length === 0) return ok('Nothing to save.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('tracks')
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return fail(error.message)

  await revalidateTrack(id)
  revalidatePath('/admin/tracks')
  return ok('Saved.')
}

/** id + any subset of: title, description, cover_url, release_date, genres. */
export async function patchAlbum(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return fail('Missing album id.')

  const { row, fieldErrors } = buildPatch(formData, {
    title: {
      parse: (form, key) => text(form, key) || INVALID,
      error: 'A release needs a title.',
    },
    description: { parse: nullableText },
    cover_url: { parse: nullableText },
    release_date: { parse: nullableText },
    genres: { parse: (form, key) => parseGenres(text(form, key)) },
  })

  if (Object.keys(fieldErrors).length > 0) {
    return fail('That change was not saved.', fieldErrors)
  }
  if (Object.keys(row).length === 0) return ok('Nothing to save.')

  const supabase = await createClient()
  const { error } = await supabase.from('albums').update(row).eq('id', id)
  if (error) return fail(error.message)

  await revalidateAlbum(id)
  revalidatePath('/admin/albums')
  revalidateShared()
  return ok('Saved.')
}

/** id + any subset of: name, bio, avatar_url, banner_url. */
export async function patchArtist(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return fail('Missing artist id.')

  const { row, fieldErrors } = buildPatch(formData, {
    name: {
      parse: (form, key) => text(form, key) || INVALID,
      error: 'An artist needs a name.',
    },
    bio: { parse: nullableText },
    avatar_url: { parse: nullableText },
    banner_url: { parse: nullableText },
  })

  if (Object.keys(fieldErrors).length > 0) {
    return fail('That change was not saved.', fieldErrors)
  }
  if (Object.keys(row).length === 0) return ok('Nothing to save.')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('artists')
    .update(row)
    .eq('id', id)
    .select('slug')
    .maybeSingle()

  if (error) return fail(error.message)

  if (data) revalidatePath(`/artist/${data.slug}`)
  revalidatePath('/admin/artist')
  revalidateShared()
  return ok('Saved.')
}

// ------------------------------------------------------------------ uploads

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/**
 * Puts an image in the public `media` bucket and hands back its URL, which
 * the caller stores on the row it belongs to.
 */
export async function uploadImage(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const refusal = demoModeRefusal()
  if (refusal) return refusal
  await requireAdmin()

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: 'Choose an image first.' }
  }
  if (!file.type.startsWith('image/')) {
    return { status: 'error', message: 'That file is not an image.' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { status: 'error', message: 'Images must be under 5 MB.' }
  }

  const folder = text(formData, 'folder') || 'covers'
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  // Random name: uploads are content-addressed by nothing, and reusing a
  // filename would serve a stale image from the CDN cache.
  const path = `${folder}/${crypto.randomUUID()}.${extension}`

  const supabase = await createClient()
  const { error } = await supabase.storage
    .from('media')
    .upload(path, file, { cacheControl: '31536000', contentType: file.type })

  if (error) return { status: 'error', message: error.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from('media').getPublicUrl(path)

  return { status: 'success', message: 'Uploaded.', url: publicUrl }
}
