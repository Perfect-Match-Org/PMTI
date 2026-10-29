-- The public share card's address: random and unguessable, set the first time a player shares.
alter table public.rooms add column share_id text unique;
