alter table public.user_settings
add column if not exists columns integer not null default 8;
