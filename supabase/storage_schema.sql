-- ==========================================
-- Supabase Storage Schema for Avatars
-- Run this in Supabase Dashboard -> SQL Editor
-- ==========================================

-- 1. Create 'avatars' bucket if not exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Avatar Public Read" on storage.objects;
drop policy if exists "Avatar Auth Upload" on storage.objects;
drop policy if exists "Avatar Auth Update" on storage.objects;
drop policy if exists "Avatar Auth Delete" on storage.objects;

-- 3. Policy: Public Read (Anyone can view avatars)
create policy "Avatar Public Read"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- 4. Policy: Authenticated Upload (Users can upload)
create policy "Avatar Auth Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' );

-- 5. Policy: Authenticated Update
create policy "Avatar Auth Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'avatars' );

-- 6. Policy: Authenticated Delete
create policy "Avatar Auth Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'avatars' );
