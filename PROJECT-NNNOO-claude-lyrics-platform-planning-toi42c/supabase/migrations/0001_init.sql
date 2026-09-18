-- Lyrics platform: initial schema
-- Solo-admin model: public reads published rows, only admins write.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------- profiles

create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- ----------------------------------------------------------------- artists

create table artists (
  id         uuid primary key default uuid_generate_v4(),
  slug       text not null unique,
  name       text not null,
  bio        text,
  avatar_url text,
  banner_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ albums

create type album_type as enum ('album', 'ep', 'single');

create table albums (
  id           uuid primary key default uuid_generate_v4(),
  artist_id    uuid not null references artists on delete cascade,
  slug         text not null unique,
  title        text not null,
  cover_url    text,
  release_date date,
  album_type   album_type not null default 'album',
  genres       text[] not null default '{}',
  description  text,
  created_at   timestamptz not null default now()
);

create index albums_artist_idx on albums (artist_id, release_date desc);

-- ------------------------------------------------------------------ tracks

create table tracks (
  id               uuid primary key default uuid_generate_v4(),
  album_id         uuid not null references albums on delete cascade,
  slug             text not null unique,
  title            text not null,
  track_number     int,
  duration_seconds int,
  lyrics           text not null default '',
  about            text,
  view_count       bigint not null default 0,
  published        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (album_id, track_number)
);

create index tracks_album_idx on tracks (album_id, track_number);

-- full-text search over title + lyrics
alter table tracks add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')),  'A') ||
    setweight(to_tsvector('simple', coalesce(lyrics, '')), 'B')
  ) stored;

create index tracks_search_idx on tracks using gin (search_vector);

-- ----------------------------------------------------------------- credits

create type credit_role as enum ('writer', 'producer', 'feature', 'mixing', 'mastering');

create table credits (
  id       uuid primary key default uuid_generate_v4(),
  track_id uuid not null references tracks on delete cascade,
  role     credit_role not null,
  name     text not null,
  position int not null default 0
);

create index credits_track_idx on credits (track_id, position);

-- ------------------------------------------------------------- annotations

create table annotations (
  id           uuid primary key default uuid_generate_v4(),
  track_id     uuid not null references tracks on delete cascade,
  start_offset int not null,
  end_offset   int not null,
  quote        text not null,   -- snapshot of the highlighted text
  body         text not null,   -- the explanation
  created_at   timestamptz not null default now(),
  check (end_offset > start_offset),
  check (start_offset >= 0)
);

create index annotations_track_idx on annotations (track_id, start_offset);

-- --------------------------------------------------------------------- RLS

alter table profiles    enable row level security;
alter table artists     enable row level security;
alter table albums      enable row level security;
alter table tracks      enable row level security;
alter table credits     enable row level security;
alter table annotations enable row level security;

-- Read your own profile only.
create policy "own profile" on profiles
  for select using (id = auth.uid());

-- Public reads.
create policy "public read artists" on artists
  for select using (true);

create policy "public read albums" on albums
  for select using (true);

create policy "public read published tracks" on tracks
  for select using (published or is_admin());

-- Child rows are only visible when their track is.
create policy "public read credits" on credits
  for select using (
    exists (
      select 1 from tracks t
      where t.id = credits.track_id and (t.published or is_admin())
    )
  );

create policy "public read annotations" on annotations
  for select using (
    exists (
      select 1 from tracks t
      where t.id = annotations.track_id and (t.published or is_admin())
    )
  );

-- Admin writes.
create policy "admin write artists" on artists
  for all using (is_admin()) with check (is_admin());

create policy "admin write albums" on albums
  for all using (is_admin()) with check (is_admin());

create policy "admin write tracks" on tracks
  for all using (is_admin()) with check (is_admin());

create policy "admin write credits" on credits
  for all using (is_admin()) with check (is_admin());

create policy "admin write annotations" on annotations
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------ view counter
-- Called via rpc() so anon can bump the counter without UPDATE on tracks.

create or replace function increment_view_count(track_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update tracks set view_count = view_count + 1
  where slug = track_slug and published;
$$;

grant execute on function increment_view_count(text) to anon, authenticated;
