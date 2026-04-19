alter table public.user_settings
add column if not exists show_titles boolean not null default true;
