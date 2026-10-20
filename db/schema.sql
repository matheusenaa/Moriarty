-- Moriarty — esquema inicial (SQLite)
-- Aplicado automaticamente na inicialização e por `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

-- ========================= Conta e perfil =========================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  gamification_enabled INTEGER NOT NULL DEFAULT 1,
  reminders_enabled INTEGER NOT NULL DEFAULT 1,
  onboarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

-- ========================= Planejamento =========================

CREATE TABLE IF NOT EXISTS study_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_name TEXT NOT NULL DEFAULT '',
  exam_date TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','concluido','arquivado')),
  weekly_hours_target REAL NOT NULL DEFAULT 10,
  session_minutes INTEGER NOT NULL DEFAULT 50,
  start_date TEXT NOT NULL,
  reserve_reviews INTEGER NOT NULL DEFAULT 1,
  reserve_simulated INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON study_goals(user_id);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES study_goals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  mastery INTEGER NOT NULL DEFAULT 2 CHECK (mastery BETWEEN 0 AND 5),
  color TEXT NOT NULL DEFAULT '#c9a227',
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mastery INTEGER NOT NULL DEFAULT 2 CHECK (mastery BETWEEN 0 AND 5),
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);

CREATE TABLE IF NOT EXISTS availability_slots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minute INTEGER NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute INTEGER NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  created_at TEXT NOT NULL,
  CHECK (end_minute > start_minute)
);
CREATE INDEX IF NOT EXISTS idx_availability_user ON availability_slots(user_id);

CREATE TABLE IF NOT EXISTS unavailable_dates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL REFERENCES study_goals(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'deterministico' CHECK (source IN ('deterministico','ia','manual')),
  explanation TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE (user_id, goal_id, week_start)
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES study_goals(id) ON DELETE SET NULL,
  schedule_id TEXT REFERENCES schedules(id) ON DELETE SET NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  planned_minutes INTEGER NOT NULL,
  actual_minutes INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'estudo' CHECK (kind IN ('estudo','revisao','simulado')),
  status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada','concluida','parcial','adiada','nao_realizada')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(user_id, subject_id);

-- ========================= Revisão espaçada =========================

CREATE TABLE IF NOT EXISTS review_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('sessao','material','topico','manual')),
  source_id TEXT,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 0,
  ease REAL NOT NULL DEFAULT 2.5,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'pendente' CHECK (state IN ('pendente','adiada','concluida')),
  last_result TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_user_due ON review_items(user_id, due_date);

CREATE TABLE IF NOT EXISTS review_history (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_at TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('facil','bom','dificil','nao_lembrei')),
  interval_before INTEGER NOT NULL,
  interval_after INTEGER NOT NULL
);

-- ========================= Materiais =========================

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('nota','link','arquivo','flashcard')),
  content_text TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT '',
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'privado' CHECK (visibility IN ('privado','amigos','link','publico')),
  share_token TEXT UNIQUE,
  share_enabled INTEGER NOT NULL DEFAULT 0,
  favorite INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  source_material_id TEXT REFERENCES materials(id) ON DELETE SET NULL,
  source_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  origin_note TEXT NOT NULL DEFAULT '',
  ai_generated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_materials_user ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_token ON materials(share_token);

CREATE TABLE IF NOT EXISTS material_tags (
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (material_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_material_tags_user ON material_tags(user_id, tag);

-- ========================= Amizade =========================

CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY,
  from_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceite','recusado','cancelado')),
  created_at TEXT NOT NULL,
  decided_at TEXT,
  UNIQUE (from_user, to_user)
);

CREATE TABLE IF NOT EXISTS friendships (
  user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE TABLE IF NOT EXISTS blocks (
  blocker TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker, blocked)
);

-- ========================= Questões e simulados =========================

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'multipla' CHECK (type IN ('multipla','certo_errado')),
  options_json TEXT NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  source_name TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT 'autoral' CHECK (origin IN ('autoral','ia','importada')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_questions_user ON questions(user_id);

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES study_goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'pratica' CHECK (mode IN ('pratica','simulado')),
  time_limit_seconds INTEGER NOT NULL DEFAULT 0,
  shuffle INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (quiz_id, question_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  answered INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  chosen_index INTEGER,
  is_correct INTEGER NOT NULL DEFAULT 0,
  seconds_spent INTEGER NOT NULL DEFAULT 0,
  UNIQUE (attempt_id, question_id)
);

-- ========================= Gamificação =========================

CREATE TABLE IF NOT EXISTS xp_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ref_table TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  xp INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (event_type, ref_table, ref_id)
);

CREATE TABLE IF NOT EXISTS user_xp (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, code)
);

-- ========================= Lembretes e fontes =========================

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('revisao','sessao')),
  time_minute INTEGER NOT NULL DEFAULT 540,
  days_json TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, kind)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  read_at TEXT,
  dedupe_key TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe ON notifications(user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES study_goals(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'cadastrada' CHECK (status IN ('cadastrada','acessada','verificada')),
  last_checked_at TEXT,
  created_at TEXT NOT NULL
);
