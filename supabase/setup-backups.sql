create extension if not exists pgcrypto;

create table if not exists public.backups (
  id text primary key,
  state jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_backups_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists backups_set_updated_at on public.backups;

create trigger backups_set_updated_at
before update on public.backups
for each row
execute function public.set_backups_updated_at();

alter table public.backups enable row level security;

drop policy if exists backups_anon_read on public.backups;
drop policy if exists backups_anon_write on public.backups;

create policy backups_anon_read
on public.backups
for select
to anon
using (true);

create policy backups_anon_write
on public.backups
for insert
to anon
with check (true);

create policy backups_anon_update
on public.backups
for update
to anon
using (true)
with check (true);

grant usage on schema public to anon;
grant select, insert, update on public.backups to anon;

insert into public.backups (id, state)
values ('default', '{"bookmarks": [], "settings": {}}'::jsonb)
on conflict (id) do nothing;

comment on table public.backups is 'Stores cloud backup payloads for the new tab extension.';

comment on policy backups_anon_read on public.backups is
'Anonymous read access for extension backup restore. Any holder of the publishable key can read this row.';

comment on policy backups_anon_write on public.backups is
'Anonymous insert access for extension backup sync. Any holder of the publishable key can write this row.';

comment on policy backups_anon_update on public.backups is
'Anonymous update access for extension backup sync. Any holder of the publishable key can overwrite this row.';