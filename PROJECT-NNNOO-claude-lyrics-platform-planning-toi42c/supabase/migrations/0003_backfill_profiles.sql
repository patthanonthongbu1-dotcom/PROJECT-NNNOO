-- Profile rows for users who existed before the signup trigger.
--
-- 0002 adds a trigger that gives every new auth user a profiles row, but a
-- trigger only fires on inserts made after it exists. Anyone who signed up
-- earlier -- likely in another app sharing this Supabase project -- has no
-- row at all, so requireAdmin() cannot tell "not an admin" apart from "no
-- row yet", and the login bounce gives no clue which it is.
--
-- Safe to re-run: the conflict clause makes it a no-op once applied.

insert into public.profiles (id, is_admin)
select u.id, false from auth.users u
on conflict (id) do nothing;
