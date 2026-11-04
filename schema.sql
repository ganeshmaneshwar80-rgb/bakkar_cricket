-- Run this entire file in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null default 'admin',
  role text not null default 'admin' check (role in ('admin','scorer')),
  created_at timestamptz not null default now()
);
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  captain text not null,
  captain_mobile text not null,
  vice_captain text not null,
  vice_captain_mobile text not null,
  players jsonb not null default '[]'::jsonb,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_a text not null,
  team_b text not null,
  match_date date not null,
  venue text default 'Bakkar',
  overs integer not null default 8,
  match_status text not null default 'Upcoming' check (match_status in ('Upcoming','Live','Completed')),
  runs integer not null default 0,
  wickets integer not null default 0,
  overs_completed text not null default '0.0',
  created_at timestamptz not null default now()
);
create table if not exists public.player_photos (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  player_name text not null,
  photo_url text not null,
  updated_at timestamptz not null default now()
);
create or replace function public.is_admin_or_scorer() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','scorer'));
$$;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.player_photos enable row level security;
drop policy if exists "public can read approved teams" on public.teams;
create policy "public can read approved teams" on public.teams for select using (approved=true or public.is_admin_or_scorer());
drop policy if exists "public can register teams" on public.teams;
create policy "public can register teams" on public.teams for insert with check (approved=false);
drop policy if exists "admin can manage teams" on public.teams;
create policy "admin can manage teams" on public.teams for all using (public.is_admin_or_scorer()) with check (public.is_admin_or_scorer());
drop policy if exists "public can read matches" on public.matches;
create policy "public can read matches" on public.matches for select using (true);
drop policy if exists "admin can manage matches" on public.matches;
create policy "admin can manage matches" on public.matches for all using (public.is_admin_or_scorer()) with check (public.is_admin_or_scorer());
drop policy if exists "public can read player photos" on public.player_photos;
create policy "public can read player photos" on public.player_photos for select using (true);
drop policy if exists "admin can manage player photos" on public.player_photos;
create policy "admin can manage player photos" on public.player_photos for all using (public.is_admin_or_scorer()) with check (public.is_admin_or_scorer());
drop policy if exists "user can read own profile" on public.profiles;
create policy "user can read own profile" on public.profiles for select using (id=auth.uid());
-- Public tournament player/contact information should be curated before publishing.
-- Private phone-number access is not exposed by the public team query in the website UI.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('player-photos','player-photos',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
drop policy if exists "public can view player photos" on storage.objects;
create policy "public can view player photos" on storage.objects for select using(bucket_id='player-photos');
drop policy if exists "admin can upload player photos" on storage.objects;
create policy "admin can upload player photos" on storage.objects for insert with check(bucket_id='player-photos' and public.is_admin_or_scorer());
drop policy if exists "admin can update player photos" on storage.objects;
create policy "admin can update player photos" on storage.objects for update using(bucket_id='player-photos' and public.is_admin_or_scorer());
drop policy if exists "admin can delete player photos" on storage.objects;
create policy "admin can delete player photos" on storage.objects for delete using(bucket_id='player-photos' and public.is_admin_or_scorer());

create unique index if not exists player_photos_player_name_unique on public.player_photos(player_name);
