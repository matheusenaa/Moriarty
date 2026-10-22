-- 0007 — Contribuições de conteúdo da comunidade (com moderação).
--
-- Usuários autenticados sugerem notas, questões e flashcards para as trilhas.
-- Nada entra no catálogo de sistema sem a aprovação de um administrador.
-- Datas em TEXT ISO (padrão do projeto).

create table if not exists content_contributions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('nota','questao','flashcard')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  options_json TEXT NOT NULL DEFAULT '[]',
  correct_index INTEGER,
  explanation TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','aprovado','rejeitado')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

create index if not exists content_contributions_user_idx
  on content_contributions (user_id, created_at desc);
create index if not exists content_contributions_status_idx
  on content_contributions (status, created_at desc);
