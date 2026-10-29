-- Anyone with a Google account can play; sign-in is no longer limited to Cornell addresses.
drop function if exists public.hook_before_user_created (jsonb);
