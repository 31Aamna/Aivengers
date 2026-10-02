-- Techtonix MVP schema. Run in the Supabase SQL editor.
-- File uploads are intentionally out of MVP scope.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text,
  role text not null default 'student'
    check (role in ('student', 'resident', 'faculty', 'organization', 'admin')),
  community_type text not null default 'campus',
  trust_score integer not null default 50
    check (trust_score >= 0 and trust_score <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null
    check (category in (
      'Internships & Scholarships',
      'Lost & Found',
      'Local Issues & Emergencies',
      'Events & Announcements'
    )),
  location text not null,
  latitude double precision,
  longitude double precision,
  urgency text not null
    check (urgency in ('Low', 'Normal', 'High', 'Critical')),
  tags text[] not null default '{}',
  is_anonymous boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'resolved', 'expired', 'reported')),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  resolved_at timestamptz,
  resolution_note text
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.validity_checks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('still_valid', 'outdated')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_category_idx on public.posts (category);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_expires_at_idx on public.posts (expires_at);
create index if not exists votes_post_id_idx on public.votes (post_id);
create index if not exists votes_user_id_idx on public.votes (user_id);
create index if not exists validity_checks_post_id_idx on public.validity_checks (post_id);
create index if not exists reports_post_id_idx on public.reports (post_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, community_type, trust_score)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'member'), '@', 1)),
    new.email,
    'student',
    'campus',
    50
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.votes enable row level security;
alter table public.validity_checks enable row level security;
alter table public.reports enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and trust_score = (select p.trust_score from public.profiles p where p.id = profiles.id)
    and role = (select p.role from public.profiles p where p.id = profiles.id)
  );

drop policy if exists posts_select_public on public.posts;
create policy posts_select_public
  on public.posts for select
  to anon, authenticated
  using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
  on public.posts for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own
  on public.posts for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) = author_id);

drop policy if exists votes_select_public on public.votes;
create policy votes_select_public
  on public.votes for select
  to anon, authenticated
  using (true);

drop policy if exists votes_insert_own on public.votes;
create policy votes_insert_own
  on public.votes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists votes_update_own on public.votes;
create policy votes_update_own
  on public.votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists validity_select_public on public.validity_checks;
create policy validity_select_public
  on public.validity_checks for select
  to anon, authenticated
  using (true);

drop policy if exists validity_insert_own on public.validity_checks;
create policy validity_insert_own
  on public.validity_checks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists validity_update_own on public.validity_checks;
create policy validity_update_own
  on public.validity_checks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists reports_select_authenticated on public.reports;
create policy reports_select_authenticated
  on public.reports for select
  to authenticated
  using (true);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own
  on public.reports for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.posts, public.votes, public.validity_checks to anon, authenticated;
grant select on public.reports to authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.posts to authenticated;
grant insert, update on public.votes, public.validity_checks to authenticated;
grant insert on public.reports to authenticated;
