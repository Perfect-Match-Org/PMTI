create extension if not exists vector with schema extensions;

-- Rooms: one game between a host and a guest. Progress is derived from moves, never stored here.
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users (id) on delete cascade,
  guest_id uuid references auth.users (id) on delete set null,
  mode text not null check (mode in ('couple', 'friends')),
  deck_id text not null,
  -- Bumped by every write to the room; drives realtime sync and stale-view detection.
  seq integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_by uuid references auth.users (id) on delete set null,
  host_shares_name boolean not null default false,
  guest_shares_name boolean not null default false,
  result jsonb,
  check (guest_id is distinct from host_id)
);

create table public.moves (
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references auth.users (id) on delete cascade,
  round integer not null,
  attempt integer not null default 0,
  kind text not null check (kind in ('ready', 'answer')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (room_id, player_id, round, attempt, kind)
);

-- Free-text answers. Rows without a room are the seed pool used for percentile scoring.
create table public.texts (
  id uuid primary key default gen_random_uuid(),
  prompt_id text not null,
  body text not null check (char_length(body) between 1 and 140),
  embedding extensions.vector (384),
  room_id uuid references public.rooms (id) on delete cascade,
  player_id uuid references auth.users (id) on delete cascade,
  round integer,
  slot text,
  match_pct real,
  created_at timestamptz not null default now(),
  unique (room_id, player_id, round, slot)
);

create index texts_pool_idx on public.texts (prompt_id, created_at desc);

-- Only the server (postgres role) touches these tables.
alter table public.rooms enable row level security;
alter table public.moves enable row level security;
alter table public.texts enable row level security;
revoke all on public.rooms, public.moves, public.texts from anon, authenticated;

-- Realtime: private channel per room ("room:<uuid>"), limited to its two players.
-- Security definer because the policy runs as `authenticated`, which cannot read rooms.
create function public.is_room_member (topic text) returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if topic !~ '^room:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return exists (
    select 1 from public.rooms r
    where r.id = substring(topic from 6)::uuid
      and (select auth.uid()) in (r.host_id, r.guest_id)
  );
end;
$$;

revoke execute on function public.is_room_member (text) from public, anon;
grant execute on function public.is_room_member (text) to authenticated;

create policy "room members receive" on realtime.messages
for select to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence')
  and public.is_room_member (realtime.topic())
);

create policy "room members send" on realtime.messages
for insert to authenticated
with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and public.is_room_member (realtime.topic())
);

-- Ping both players whenever the room changes; delivered only if the transaction commits.
create function public.rooms_sync () returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform realtime.send(jsonb_build_object('v', new.seq), 'sync', 'room:' || new.id::text, true);
  return null;
end;
$$;

create trigger rooms_sync
after update of seq on public.rooms
for each row execute function public.rooms_sync ();

-- Auth: Cornell accounts only, plus the Perfect Match gmail.
create function public.hook_before_user_created (event jsonb) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  email text := lower(event -> 'user' ->> 'email');
begin
  if email like '%@cornell.edu' or email = 'cornell.perfectmatch@gmail.com' then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'PMTI is for Cornell accounts. Sign in with your @cornell.edu email.'
    )
  );
end;
$$;

revoke execute on function public.hook_before_user_created (jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created (jsonb) to supabase_auth_admin;
