-- 0010 - Cronometro de estudo
CREATE TABLE IF NOT EXISTS study_timer_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  goal_id TEXT REFERENCES study_goals(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL DEFAULT '' CHECK (activity_type IN ('','teoria','videoaula','questoes','revisao','simulado','resumo','flashcards')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','paused','completed','cancelled')),
  started_at TEXT NOT NULL,
  resumed_at TEXT,
  last_pause_at TEXT,
  accumulated_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_timer_user_status ON study_timer_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_study_timer_started_at ON study_timer_sessions(user_id, started_at);

CREATE TABLE IF NOT EXISTS study_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  goal_id TEXT REFERENCES study_goals(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'timer' CHECK (source IN ('timer','manual')),
  timer_session_id TEXT REFERENCES study_timer_sessions(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_activities_user_date ON study_activities(user_id, date);
CREATE INDEX IF NOT EXISTS idx_study_activities_subject ON study_activities(user_id, subject_id);