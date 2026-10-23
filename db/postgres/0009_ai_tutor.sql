-- 0009 — Tutor IA online, histórico, ações confirmadas e cota diária.
--
-- O agente NUNCA executa ações sozinho: a IA propõe e o usuário confirma.
-- Tudo é filtrado por user_id no servidor (sem RLS, como no restante do app).

create table if not exists agent_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
create index if not exists agent_messages_user_idx on agent_messages (user_id, created_at desc);

create table if not exists agent_actions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES agent_messages(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('create_session', 'schedule_review', 'create_goal')),
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aplicado', 'descartado', 'falhou')),
  result TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  decided_at TEXT
);
create index if not exists agent_actions_user_status_idx on agent_actions (user_id, status);
create index if not exists agent_actions_message_idx on agent_actions (message_id);

create table if not exists ai_usage (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  calls INTEGER NOT NULL DEFAULT 0,
  primary key (user_id, day)
);
