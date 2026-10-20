-- Moriarty — migração Supabase 0002: catálogo de conteúdo mantido pela plataforma.
-- Equivalente a db/migrations/002_catalogo.sql (SQLite). Ponto de partida revisável.
--
-- IMPORTANTE: diferente das tabelas de usuário, o catálogo é GLOBAL e somente leitura
-- para os clientes. Ninguém escreve via anon/authenticated — o conteúdo é semeado pelo
-- backend (service role) a partir de scripts/seed-catalog.mjs. Logo, as políticas RLS
-- abaixo concedem apenas SELECT.

create table if not exists catalog_collections (
  id text primary key,
  slug text not null unique,
  title text not null,
  discipline_label text not null default 'Concursos',
  summary text not null default '',
  status text not null default 'comum'
    check (status in ('vigente','historico','comum','aguardando')),
  status_note text not null default '',
  source_name text not null default '',
  source_url text not null default '',
  edital_ref text not null default '',
  checked_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog_items (
  id text primary key,
  collection_id text not null references catalog_collections(id) on delete cascade,
  kind text not null check (kind in ('area','nota','flashcard','questao','fonte')),
  category text not null default 'resumo_proprio'
    check (category in ('oficial','resumo_proprio','questao_autoral','flashcard','fonte_externa')),
  title text not null,
  body text not null default '',
  options_json text not null default '',
  correct_index int,
  explanation text not null default '',
  origin_note text not null default '',
  ref_label text not null default '',
  url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, title, kind)
);
create index if not exists idx_catalog_items_collection
  on catalog_items(collection_id, kind, sort_order);

-- ========================= RLS =========================
-- Catálogo é conteúdo público-para-autenticados: leitura livre, escrita bloqueada.
-- O seed roda com service role (ignora RLS). Para permitir leitura anônima também,
-- troque `to authenticated` por `to anon, authenticated` (ou remova o `to`).

alter table catalog_collections enable row level security;
drop policy if exists "catalog_collections_read" on catalog_collections;
create policy "catalog_collections_read" on catalog_collections
  for select to authenticated using (true);
-- Sem política de insert/update/delete: negadas por padrão.

alter table catalog_items enable row level security;
drop policy if exists "catalog_items_read" on catalog_items;
create policy "catalog_items_read" on catalog_items
  for select to authenticated using (true);
