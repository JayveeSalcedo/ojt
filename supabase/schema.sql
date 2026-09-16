-- Run in Supabase SQL editor
create extension if not exists "pgcrypto";

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  campus text,
  instructor text,
  company text,
  job_description text,
  start_date date,
  end_date date,
  required_hours numeric not null default 486
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  time_in timestamptz,
  time_out timestamptz,
  break_minutes int not null default 60,
  hours numeric not null default 0,
  narrative_raw text,
  narrative_ai text,
  tasks text,
  learnings text,
  created_at timestamptz default now(),
  unique (student_id, date)
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now()
);

-- No-login app: allow anon access (anyone with the app URL can read/write).
alter table students enable row level security;
alter table entries enable row level security;
alter table photos enable row level security;
drop policy if exists "anon all students" on students;
drop policy if exists "anon all entries" on entries;
drop policy if exists "anon all photos" on photos;
create policy "anon all students" on students for all using (true) with check (true);
create policy "anon all entries" on entries for all using (true) with check (true);
create policy "anon all photos" on photos for all using (true) with check (true);

-- Storage bucket for photos
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;
drop policy if exists "anon photos rw" on storage.objects;
create policy "anon photos rw" on storage.objects for all
  using (bucket_id = 'photos') with check (bucket_id = 'photos');
