-- Data Forge schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Lists table — one row per uploaded CSV
create table lists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  columns    jsonb not null default '[]'::jsonb,
  row_count  integer not null default 0,
  cleaned    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. List rows table — one row per CSV row, data stored as flexible JSONB
create table list_rows (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references lists(id) on delete cascade,
  row_index    integer not null,
  data         jsonb not null default '{}'::jsonb,
  flags        jsonb not null default '{}'::jsonb,
  is_duplicate boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Index for fast lookups by list
create index list_rows_list_id_idx on list_rows(list_id, row_index);

-- 3. Enable RLS (open policies for Phase 1 — no auth)
alter table lists enable row level security;
alter table list_rows enable row level security;

create policy "Allow all on lists"
  on lists for all
  using (true)
  with check (true);

create policy "Allow all on list_rows"
  on list_rows for all
  using (true)
  with check (true);
