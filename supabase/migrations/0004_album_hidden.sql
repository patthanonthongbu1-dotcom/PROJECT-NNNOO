-- Hide / unhide whole releases.
--
-- A hidden album disappears from the public site together with its tracks.
-- Filtering lives in RLS, so every read path (home, search, sitemap, static
-- params) drops it without per-query filters. Credits and annotations gate
-- on a tracks subquery, which runs under the tracks policy, so they follow.

alter table albums add column hidden boolean not null default false;

drop policy "public read albums" on albums;
create policy "public read albums" on albums
  for select using (not hidden or is_admin());

drop policy "public read published tracks" on tracks;
create policy "public read published tracks" on tracks
  for select using (
    (
      published
      and exists (
        select 1 from albums a
        where a.id = tracks.album_id and not a.hidden
      )
    )
    or is_admin()
  );

-- security definer bypasses RLS, so the hidden check has to be explicit here.
create or replace function increment_view_count(track_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update tracks set view_count = view_count + 1
  where slug = track_slug
    and published
    and not exists (
      select 1 from albums a where a.id = tracks.album_id and a.hidden
    );
$$;
