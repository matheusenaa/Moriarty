-- Moriarty — migração 003 (PostgreSQL): progresso do usuário sobre o catálogo.
-- Equivalente a db/migrations/003_catalog_progress.sql.

CREATE TABLE IF NOT EXISTS catalog_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK (state IN ('lido', 'dominado')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_progress_user ON catalog_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_progress_item ON catalog_progress(item_id);
