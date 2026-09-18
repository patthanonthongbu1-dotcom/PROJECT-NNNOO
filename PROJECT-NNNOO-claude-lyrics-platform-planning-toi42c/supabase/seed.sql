-- Optional starter rows so the site renders before you've written anything.
-- The lyrics fields are deliberately empty scaffolding: replace every one of
-- them with your own writing from the admin panel.

insert into artists (slug, name, bio)
values (
  'your-artist-name',
  'Your Artist Name',
  'Write your artist bio here. Where you''re from, what you make, who you make it for.'
);

insert into albums (artist_id, slug, title, release_date, album_type, genres, description)
select
  a.id,
  'first-album',
  'First Album',
  current_date,
  'album',
  array['alternative', 'bedroom pop'],
  'A short note about what this record is about.'
from artists a
where a.slug = 'your-artist-name';

insert into tracks (album_id, slug, title, track_number, lyrics, published)
select
  al.id,
  'track-one',
  'Track One',
  1,
  E'[Verse 1]\n\n\n[Chorus]\n\n\n[Verse 2]\n',
  false
from albums al
where al.slug = 'first-album';
