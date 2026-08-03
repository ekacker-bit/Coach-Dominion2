
-- Build 022B: private, account-owned progress-photo evidence.
create extension if not exists pgcrypto;

create table if not exists public.body_progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  performance_date date not null,
  angle text not null check (angle in ('FRONT', 'SIDE', 'BACK')),
  storage_path text not null,
  content_type text not null default 'image/jpeg',
  size_bytes integer not null default 0 check (size_bytes >= 0 and size_bytes <= 8388608),
  width integer null check (width is null or width > 0),
  height integer null check (height is null or height > 0),
  capture_protocol text not null default 'STANDARD_WEEKLY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, performance_date, angle),
  unique (storage_path)
);

create index if not exists body_progress_photos_user_date_idx
  on public.body_progress_photos (user_id, performance_date desc);

alter table public.body_progress_photos enable row level security;

drop policy if exists body_progress_photos_select_own on public.body_progress_photos;
create policy body_progress_photos_select_own on public.body_progress_photos
  for select using (auth.uid() = user_id);

drop policy if exists body_progress_photos_insert_own on public.body_progress_photos;
create policy body_progress_photos_insert_own on public.body_progress_photos
  for insert with check (auth.uid() = user_id);

drop policy if exists body_progress_photos_update_own on public.body_progress_photos;
create policy body_progress_photos_update_own on public.body_progress_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists body_progress_photos_delete_own on public.body_progress_photos;
create policy body_progress_photos_delete_own on public.body_progress_photos
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.body_progress_photos to authenticated;

drop trigger if exists body_progress_photos_set_updated_at on public.body_progress_photos;
create trigger body_progress_photos_set_updated_at
before update on public.body_progress_photos
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'body-progress-photos',
  'body-progress-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists body_progress_storage_select_own on storage.objects;
create policy body_progress_storage_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'body-progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists body_progress_storage_insert_own on storage.objects;
create policy body_progress_storage_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'body-progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists body_progress_storage_update_own on storage.objects;
create policy body_progress_storage_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'body-progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'body-progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists body_progress_storage_delete_own on storage.objects;
create policy body_progress_storage_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'body-progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

