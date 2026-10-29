-- Guests the host removed: they can't rejoin by reopening the link.
alter table public.rooms add column kicked uuid[] not null default '{}';
