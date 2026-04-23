
-- profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  bio text,
  avatar_url text,
  github_url text,
  linkedin_url text,
  twitter_url text,
  leetcode_url text,
  theme text not null default 'dark',
  accent text not null default 'violet',
  font_pair text not null default 'inter-jetbrains',
  active_persona text not null default 'architect',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "owner read profile" on public.profiles for select using (auth.uid() = user_id);
create policy "public read published profile" on public.profiles for select using (is_published = true);
create policy "owner insert profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "owner update profile" on public.profiles for update using (auth.uid() = user_id);
create policy "owner delete profile" on public.profiles for delete using (auth.uid() = user_id);

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  tech_stack text[] not null default '{}',
  github_link text,
  live_demo_url text,
  image_url text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;

create policy "owner read projects" on public.projects for select using (auth.uid() = user_id);
create policy "public read projects of published profile" on public.projects for select using (
  exists (select 1 from public.profiles p where p.user_id = projects.user_id and p.is_published = true)
);
create policy "owner write projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "owner update projects" on public.projects for update using (auth.uid() = user_id);
create policy "owner delete projects" on public.projects for delete using (auth.uid() = user_id);

-- vibe_narratives
create table public.vibe_narratives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  persona text not null check (persona in ('architect','impact','visionary')),
  content_text text not null,
  created_at timestamptz not null default now(),
  unique (project_id, persona)
);
alter table public.vibe_narratives enable row level security;

create policy "owner read narratives" on public.vibe_narratives for select using (auth.uid() = user_id);
create policy "public read narratives of published profile" on public.vibe_narratives for select using (
  exists (select 1 from public.profiles p where p.user_id = vibe_narratives.user_id and p.is_published = true)
);
create policy "owner write narratives" on public.vibe_narratives for insert with check (auth.uid() = user_id);
create policy "owner update narratives" on public.vibe_narratives for update using (auth.uid() = user_id);
create policy "owner delete narratives" on public.vibe_narratives for delete using (auth.uid() = user_id);

-- profile-level narrative (bio rewrites per persona)
create table public.profile_narratives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona text not null check (persona in ('architect','impact','visionary')),
  headline text,
  summary text,
  skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, persona)
);
alter table public.profile_narratives enable row level security;

create policy "owner read pnarr" on public.profile_narratives for select using (auth.uid() = user_id);
create policy "public read pnarr published" on public.profile_narratives for select using (
  exists (select 1 from public.profiles p where p.user_id = profile_narratives.user_id and p.is_published = true)
);
create policy "owner write pnarr" on public.profile_narratives for insert with check (auth.uid() = user_id);
create policy "owner update pnarr" on public.profile_narratives for update using (auth.uid() = user_id);
create policy "owner delete pnarr" on public.profile_narratives for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects
for each row execute function public.touch_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Storage bucket for resumes (private)
insert into storage.buckets (id, name, public) values ('resumes','resumes', false)
on conflict (id) do nothing;

create policy "users upload own resume" on storage.objects for insert
with check (bucket_id='resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users read own resume" on storage.objects for select
using (bucket_id='resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users update own resume" on storage.objects for update
using (bucket_id='resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users delete own resume" on storage.objects for delete
using (bucket_id='resumes' and auth.uid()::text = (storage.foldername(name))[1]);
