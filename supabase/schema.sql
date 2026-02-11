-- ============================================
-- Supabase Schema for Monox AI Chat App
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- ==========================================
-- STEP 1: CREATE ALL TABLES FIRST
-- ==========================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- 2. ROOMS TABLE
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text default 'direct' check (type in ('direct', 'group', 'ai')),
  topic text default 'general',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

-- 3. ROOM_MEMBERS TABLE
create table if not exists public.room_members (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

-- 4. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  sender_type text default 'user' check (sender_type in ('user', 'ai')),
  image_url text,
  created_at timestamptz default now()
);

-- ==========================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ==========================================

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

-- ==========================================
-- STEP 3: CREATE ALL RLS POLICIES
-- (now all tables exist, safe to reference)
-- ==========================================

-- Profiles policies
create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

-- Rooms policies
create policy "Users can view rooms they are members of"
  on public.rooms for select
  to authenticated
  using (
    id in (
      select room_id from public.room_members
      where user_id = (select auth.uid())
    )
  );

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "Room creators can delete their rooms"
  on public.rooms for delete
  to authenticated
  using (created_by = (select auth.uid()));

-- Room_members policies
create policy "Users can view their own memberships"
  on public.room_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can view members of their rooms"
  on public.room_members for select
  to authenticated
  using (
    room_id in (
      select room_id from public.room_members
      where user_id = (select auth.uid())
    )
  );

create policy "Authenticated users can join rooms"
  on public.room_members for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Messages policies
create policy "Users can read room messages"
  on public.messages for select
  to authenticated
  using (
    room_id in (
      select room_id from public.room_members
      where user_id = (select auth.uid())
    )
  );

create policy "Users can insert messages in their rooms"
  on public.messages for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and room_id in (
      select room_id from public.room_members
      where user_id = (select auth.uid())
    )
  );

-- ==========================================
-- STEP 4: AUTO-CREATE PROFILE ON SIGNUP
-- ==========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- STEP 5: ENABLE REALTIME
-- ==========================================

alter publication supabase_realtime add table public.messages;
