-- ============================================
-- SQL Migration for Social Features & RLS Fix
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================

-- 1. FIX INFINITE RECURSION ERROR & ROOM CREATION
create or replace function public.is_member_of(_room_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.room_members
    where room_id = _room_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Update RLS Policy for room_members
drop policy if exists "Users can view members of their rooms" on public.room_members;
create policy "Users can view members of their rooms"
  on public.room_members for select
  to authenticated
  using (
    public.is_member_of(room_id)
  );

-- Update RLS Policy for messages
drop policy if exists "Users can read room messages" on public.messages;
create policy "Users can read room messages"
  on public.messages for select
  to authenticated
  using (
    public.is_member_of(room_id)
  );

-- *** CRITICAL FIX 1: Allow creators to see their own rooms ***
drop policy if exists "Users can view rooms they are members of" on public.rooms;
create policy "Users can view rooms they are members of"
  on public.rooms for select
  to authenticated
  using (
    id in (
      select room_id from public.room_members
      where user_id = auth.uid()
    )
    or created_by = auth.uid() 
  );

-- *** CRITICAL FIX 3: RPC Function to Add Members (Bypasses RLS) ***
-- This is the robust way to add members
create or replace function public.add_group_members(
  _room_id uuid,
  _user_ids uuid[]
)
returns void as $$
begin
  -- Check if executor is the creator OR is self-joining (for public rooms logic if needed)
  if exists (
    select 1 from public.rooms
    where id = _room_id
    and created_by = auth.uid()
  ) or (
    array_length(_user_ids, 1) = 1 and _user_ids[1] = auth.uid()
  ) then
    insert into public.room_members (room_id, user_id)
    select _room_id, u.id
    from unnest(_user_ids) as u(id)
    on conflict (room_id, user_id) do nothing;
  else
    raise exception 'Not authorized to add members to this room';
  end if;
end;
$$ language plpgsql security definer;

-- 2. CREATE FRIENDSHIPS TABLE
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  friend_id uuid references auth.users not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Enable RLS
alter table public.friendships enable row level security;

-- 3. FRIENDSHIPS POLICIES
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'friendships' and policyname = 'Users can view their friendships') then
    create policy "Users can view their friendships" on public.friendships for select to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'friendships' and policyname = 'Users can request friendship') then
    create policy "Users can request friendship" on public.friendships for insert to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'friendships' and policyname = 'Users can update friendship status') then
    create policy "Users can update friendship status" on public.friendships for update to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'friendships' and policyname = 'Users can delete friendship') then
    create policy "Users can delete friendship" on public.friendships for delete to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);
  end if;
end $$;

-- 4. HELPER FUNCTION TO SEARCH USERS
create or replace function public.search_users(search_term text)
returns table (id uuid, username text, avatar_url text) as $$
begin
  return query
  select p.id, p.username, p.avatar_url
  from public.profiles p
  where p.username ilike '%' || search_term || '%'
  limit 10;
end;
$$ language plpgsql security definer;
