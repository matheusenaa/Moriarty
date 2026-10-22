-- 0006 — Simulados por trilha de concurso.
--
-- O conteúdo das questões continua no catálogo (tabela de sistema, `catalog_items`).
-- Aqui ficam apenas os dados PESSOAIS da tentativa: quais questões foram sorteadas,
-- as respostas dadas e o resultado. Datas em TEXT ISO (padrão do projeto).

create table if not exists catalog_quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL,
  collection_slug TEXT NOT NULL,
  question_ids_json TEXT NOT NULL DEFAULT '[]',
  duration_minutes INTEGER NOT NULL DEFAULT 20,
  answers_json TEXT NOT NULL DEFAULT '[]',
  correct_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT
);

create index if not exists catalog_quiz_attempts_user_idx
  on catalog_quiz_attempts (user_id, started_at desc);
