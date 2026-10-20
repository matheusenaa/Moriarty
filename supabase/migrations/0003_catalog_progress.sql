-- Moriarty — migração Supabase 0003: progresso do usuário sobre o catálogo.
-- Equivalente a db/migrations/003_catalog_progress.sql (SQLite). Ponto de partida revisável.
--
-- O progresso é DADO PESSOAL: cada linha pertence a auth.uid(). RLS por dono.

create table if not exists catalog_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references catalog_items(id) on delete cascade,
  state text not null check (state in ('lido','dominado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);
create index if not exists idx_catalog_progress_user on catalog_progress(user_id);
create index if not exists idx_catalog_progress_item on catalog_progress(item_id);

-- ========================= RLS =========================
alter table catalog_progress enable row level security;
drop policy if exists "catalog_progress_owner_select" on catalog_progress;
drop policy if exists "catalog_progress_owner_modify" on catalog_progress;

create policy "catalog_progress_owner_select" on catalog_progress
  for select using (user_id = auth.uid());

create policy "catalog_progress_owner_modify" on catalog_progress
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
