-- Merch showcase, editable from /admin/merch. Nothing is for sale: no prices,
-- no stock, no orders. Public reads everything, only admins write.

create table merch (
  id             uuid primary key default uuid_generate_v4(),
  slug           text not null unique,
  name           text not null,
  type           text not null default 'bookmark' check (type in ('bookmark', 'standee')),
  status         text not null default 'collected' check (status in ('collected', 'locked')),
  drop_date      date,
  -- set null: deleting an album keeps its merch, just unpaired.
  album_id       uuid references albums on delete set null,
  size           text not null default '',
  finish         text not null default '',
  printed_by     text not null default '',
  released       text not null default '',
  edition        text not null default '',
  header_tint    text not null default '#FBE3EC',
  art_bg         text not null default '#F48FB1',
  -- [{ "src": "...", "alt": "...", "label": "..." }], in display order.
  photos         jsonb not null default '[]',
  is_latest_drop boolean not null default false,
  created_at     timestamptz not null default now()
);

-- At most one "latest drop".
create unique index merch_one_latest_drop on merch (is_latest_drop) where is_latest_drop;

alter table merch enable row level security;

create policy "public read merch" on merch
  for select using (true);

create policy "admin write merch" on merch
  for all using (is_admin()) with check (is_admin());

-- The item that used to live in src/lib/merch.ts.
insert into merch (
  slug, name, type, status, album_id, size, printed_by, released, edition,
  header_tint, art_bg, photos, is_latest_drop
)
values (
  'agtde-bookmark',
  'A Girl That Doesn''t Exist: Bookmark',
  'bookmark',
  'collected',
  (select id from albums where slug = 'a-girl-that-doesnt-exist'),
  '5.5 × 16 cm',
  'Master Photo',
  'Nov 2026',
  '18 copies (10 available)',
  '#FBE3EC',
  '#B04A66',
  '[{"src": "/images/merch/agtde-bookmark/front-and-back.png", "alt": "Front and back of a pink bookmark: the front shows a white-haired girl with glasses and a black mask reading a book, the back has white geometric patterns", "label": "Front & back"}]',
  true
)
on conflict (slug) do nothing;
