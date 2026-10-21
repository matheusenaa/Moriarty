-- Moriarty — migração 002 (PostgreSQL): catálogo de conteúdo de concursos.
-- Equivalente a db/migrations/002_catalogo.sql.

CREATE TABLE IF NOT EXISTS catalog_collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  discipline_label TEXT NOT NULL DEFAULT 'Concursos',
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'comum'
    CHECK (status IN ('vigente','historico','comum','aguardando')),
  status_note TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  edital_ref TEXT NOT NULL DEFAULT '',
  checked_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES catalog_collections(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('area','nota','flashcard','questao','fonte')),
  category TEXT NOT NULL DEFAULT 'resumo_proprio'
    CHECK (category IN ('oficial','resumo_proprio','questao_autoral','flashcard','fonte_externa')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  options_json TEXT NOT NULL DEFAULT '',
  correct_index INTEGER,
  explanation TEXT NOT NULL DEFAULT '',
  origin_note TEXT NOT NULL DEFAULT '',
  ref_label TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (collection_id, title, kind)
);
CREATE INDEX IF NOT EXISTS idx_catalog_items_collection ON catalog_items(collection_id, kind, sort_order);
