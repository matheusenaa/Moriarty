-- Moriarty — migração 004 (PostgreSQL): respostas às questões de treino das trilhas.
-- Guarda o ÚLTIMO resultado de cada usuário por questão (upsert) e quantas vezes tentou.
-- Dado PESSOAL: não altera o conteúdo do catálogo (catalog_items é somente leitura).

CREATE TABLE IF NOT EXISTS catalog_answers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  chosen_index INTEGER NOT NULL,
  is_correct SMALLINT NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  attempts INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_answers_user ON catalog_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_answers_item ON catalog_answers(item_id);
