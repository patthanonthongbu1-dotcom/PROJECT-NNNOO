# Lyrics Platform — Build Plan

A personal Genius/Spotify-style site. One artist (me), my own original lyrics,
browsable publicly, editable only by me.

## Decisions

| Question | Decision |
|---|---|
| Who can post | **Solo admin.** One account writes, everyone else reads. |
| Features | Lyrics + credits, **plus Genius-style annotations** |
| Look | **Spotify-like** — dark, album grid, sidebar nav |
| Audio player | Deferred (phase 5, optional) |
| Synced lyrics | Deferred (needs audio first) |

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Supabase** — Postgres, Auth (magic link), Storage (cover art)
- **Tailwind CSS** + **shadcn/ui**
- **Vercel** for hosting

### Why Supabase over Firebase here

The data is relational: artist → album → track → annotation. In Firestore
that means nested reads or duplicated data. In Postgres it's one join.
Postgres also gives full-text search (`tsvector`) for free, which we need
for "search across all lyrics" — Firestore would push us to Algolia for that.

## Data model

```
artists      id, slug, name, bio, avatar_url, banner_url, monthly_listeners
albums       id, artist_id, slug, title, cover_url, release_date,
             album_type (album|ep|single), genres[], description
tracks       id, album_id, slug, title, track_number, duration_seconds,
             lyrics, about, view_count, published
credits      id, track_id, role (writer|producer|feature|mixing), name
annotations  id, track_id, start_offset, end_offset, quote, body
profiles     id (= auth.uid), is_admin
```

### Annotation offsets

Annotations store `start_offset` / `end_offset` as character indices into
`tracks.lyrics`, plus a denormalized `quote` snapshot of the highlighted
text. The quote is the safety net: if the lyrics get edited, offsets drift,
so on render we verify `lyrics.slice(start, end) === quote` and hide (or
flag for re-anchoring) any annotation that no longer matches. Simple, and
avoids a rich-text document model.

## Routes

| Route | Purpose |
|---|---|
| `/` | Home — featured album, latest tracks |
| `/artist/[slug]` | Artist page: banner, bio, discography |
| `/album/[slug]` | Tracklist with cover, year, genres |
| `/lyrics/[trackSlug]` | Lyrics + credits + annotations |
| `/search` | Full-text over titles and lyrics |
| `/admin` | The Studio: auth-gated dashboard, linked as a tab for everyone |
| `/admin/tracks/[id]` | Lyrics editor + annotation editor |

The public pages double as the editor. Signed in as an admin, a toggle turns
the reading view into an editing one in place; `/admin` keeps everything
structural (creating and deleting rows, slugs, track numbers, album
membership), because those need a form and a confirm step, not a click while
reading.

## Security

- **RLS on every table.** Anonymous role gets `SELECT` on published rows only.
- All `INSERT`/`UPDATE`/`DELETE` gated behind `is_admin()`, which checks
  `profiles.is_admin` for the current `auth.uid()`.
- Storage bucket `media` is public-read, admin-write.
- Never ship the service-role key to the client — it bypasses RLS entirely.
  Only the anon key goes in `NEXT_PUBLIC_*`.

## Phases

### Phase 1 — Foundation
- [ ] `create-next-app` with TS + Tailwind + App Router
- [ ] Supabase project, run schema migration
- [ ] Generate TS types from the DB (`supabase gen types`)
- [ ] Env wiring, deploy an empty shell to Vercel

### Phase 2 — Admin
- [ ] Magic-link login, admin route guard via `src/proxy.ts` (Next 16 renamed middleware to proxy)
- [ ] CRUD: artist profile, albums, tracks
- [ ] Cover art upload to Supabase Storage
- [ ] Lyrics editor (plain textarea — lyrics are plain text)

### Phase 3 — Public site
- [ ] Layout: sidebar nav, dark theme, album cards
- [ ] Artist, album, lyrics pages
- [ ] Credits rendering
- [ ] Static generation + ISR so pages are fast and cheap

### Phase 4 — Annotations
- [ ] Reader: click a highlighted line → popup with the explanation
- [ ] Admin: select lyrics text → write annotation → saves offsets + quote
- [ ] Drift detection on render

### Phase 5 — Polish
- [ ] Full-text search page
- [ ] View counts (RPC increment, not a client-side update)
- [ ] Dynamic OG images so shared links preview nicely
- [ ] Optional: audio player, then synced lyrics

### Phase 6 — One surface
- [x] Genius-style reading: standing highlights, a sticky note panel on
      desktop and a bottom sheet on mobile, prev/next, `#note-<id>` links
- [x] Bottom tab bar below `lg` — there was no mobile navigation at all, and
      no way into the editor from a phone
- [x] Studio as a visible tab rather than a hidden tap target
- [x] Edit mode on the public pages, including writing an annotation by
      selecting the words it is about

## Notes

- Content is my own original writing. If the site ever opens to other
  contributors, it needs a takedown path — real lyrics sites license their
  catalogs.
- Keep `lyrics` as plain `text` with `\n` line breaks. No markdown, no HTML.
  Section headers like `[Chorus]` are just convention, styled at render time.
