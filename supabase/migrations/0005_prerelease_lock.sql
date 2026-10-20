-- Lock lyrics until release day.
--
-- A published track on an album whose release_date is still ahead is
-- unreadable (row hidden by RLS) unless it was put out early as a single.
-- The album page still lists those tracks greyed out, via locked_tracks(),
-- which exposes titles only — never lyrics. current_date is UTC on Supabase,
-- matching isUpcoming() in src/lib/format.ts.

alter table tracks add column early_release boolean not null default false;

drop policy "public read published tracks" on tracks;
create policy "public read published tracks" on tracks
  for select using (
    (
      published
      and exists (
        select 1 from albums a
        where a.id = tracks.album_id
          and not a.hidden
          and (tracks.early_release or a.release_date is null or a.release_date <= current_date)
      )
    )
    or is_admin()
  );

create or replace function locked_tracks(album uuid)
returns table (id uuid, title text, track_number int, duration_seconds int)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.title, t.track_number, t.duration_seconds
  from tracks t join albums a on a.id = t.album_id
  where t.album_id = album
    and t.published
    and not t.early_release
    and not a.hidden
    and a.release_date > current_date;
$$;

grant execute on function locked_tracks(uuid) to anon, authenticated;
