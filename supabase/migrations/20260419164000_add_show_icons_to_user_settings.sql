alter table public.user_settings
add column if not exists show_icons boolean not null default true;
