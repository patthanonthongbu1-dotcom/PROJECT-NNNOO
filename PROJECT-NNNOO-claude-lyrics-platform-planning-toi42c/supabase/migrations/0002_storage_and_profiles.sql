-- Storage for cover art, and automatic profile rows on signup.

-- ------------------------------------------------------------- media bucket

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Anyone can read cover art; only admins can add or remove it.

create policy "public read media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "admin upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and is_admin());

create policy "admin update media"
  on storage.objects for update
  using (bucket_id = 'media' and is_admin());

create policy "admin delete media"
  on storage.objects for delete
  using (bucket_id = 'media' and is_admin());

-- ---------------------------------------------------------- profile on join

/*
 * Every auth user gets a profiles row automatically, with is_admin = false.
 *
 * Without this, signing in leaves no row at all and requireAdmin() bounces
 * you straight back to the login screen with no way to tell "not an admin"
 * from "not set up yet". Promotion to admin is still a deliberate manual
 * step -- see the README -- so a stranger signing in gains nothing.
 */
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, is_admin)
  values (new.id, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
