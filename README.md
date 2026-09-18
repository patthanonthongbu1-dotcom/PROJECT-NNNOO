# Lyrics Platform

A personal, Genius/Spotify-style site for my own original lyrics. One artist,
public reading, admin-only editing.

See [`docs/PLAN.md`](docs/PLAN.md) for the design decisions behind it.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Vercel

## Setup

### 1. Create the Supabase project

1. Make a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Run [`supabase/migrations/0002_storage_and_profiles.sql`](supabase/migrations/0002_storage_and_profiles.sql),
   which creates the public `media` bucket for cover art and the trigger that
   gives every new auth user a profile row.
4. Optionally run [`supabase/seed.sql`](supabase/seed.sql) for placeholder rows
   to click around in.

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the values from **Project Settings → API**:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your domain in production |

The anon key is meant to be public — it ends up in the browser bundle. Every
table has row level security, so it can only read published rows and can only
write for an admin user. **Do not** put the `service_role` key in this file;
it bypasses RLS entirely.

### 3. Make yourself the admin

Run the app, go to `/admin`, and sign in with your email. A trigger creates
your `profiles` row automatically, but with `is_admin = false` — promotion is
deliberately manual, so signing in never grants anyone write access by itself.
In the Supabase SQL editor:

```sql
insert into profiles (id, is_admin)
select id, true from auth.users where email = 'you@example.com'
on conflict (id) do update set is_admin = true;
```

Sign out and back in. You now have write access, and nobody else does.

### 4. Run it

```bash
npm install
npm run dev
```

## Deploying

Push to GitHub, import the repo on Vercel, and add the same three environment
variables in the project settings. Set `NEXT_PUBLIC_SITE_URL` to the production
domain so magic-link redirects and OG image URLs point to the right place.

Add your production URL to **Authentication → URL Configuration → Redirect URLs**
in Supabase, or magic links will bounce back to localhost.

## Layout

```
src/
  app/
    (site)/          public pages — home, artist, album, lyrics, search
    admin/           auth-gated dashboard
  components/        UI
  lib/
    supabase/        browser + server clients
    annotations.ts   offset anchoring and drift detection
    queries.ts       data access
supabase/
  migrations/        schema + RLS
  seed.sql           placeholder rows
```

## Content

The lyrics on this site are my own. If it ever opens up to other contributors,
it needs a takedown path — the real lyrics sites license their catalogs.
