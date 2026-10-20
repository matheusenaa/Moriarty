-- Moriarty — esquema PostgreSQL/Supabase equivalente (ponto de partida, NÃO aplicado automaticamente).
--
-- O app em execução usa SQLite (db/schema.sql). Este arquivo existe para uma futura
-- migração a Supabase/Postgres e demonstra o isolamento por usuário via RLS.
--
-- Pressupostos:
--   * Usa Supabase Auth: auth.users(id) é o dono dos dados.
--   * Todas as tabelas têm user_id = auth.uid() e RLS habilitado.
--   * Aplicar via Supabase CLI/migrations ou SQL Editor. Revise antes de usar em produção.
--
-- Observação: a migração real também exige reescrever src/lib/db.ts e src/lib/repo/*
-- para um cliente Postgres. Veja docs/DEPLOY.md.

-- Extensões
create extension if not exists "pgcrypto";

-- ========================= Conta e perfil =========================

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  timezone text not null default 'America/Sao_Paulo',
  gamification_enabled boolean not null default true,
  reminders_enabled boolean not null default true,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========================= Planejamento =========================

create table if not exists study_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  exam_name text not null default '',
  exam_date date,
  status text not null default 'ativo' check (status in ('ativo','concluido','arquivado')),
  weekly_hours_target real not null default 10,
  session_minutes int not null default 50,
  start_date date not null,
  reserve_reviews boolean not null default true,
  reserve_simulated boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_goals_user on study_goals(user_id);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references study_goals(id) on delete cascade,
  name text not null,
  priority int not null default 3 check (priority between 1 and 5),
  mastery int not null default 2 check (mastery between 0 and 5),
  color text not null default '#c9a227',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_subjects_user on subjects(user_id);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  mastery int not null default 2 check (mastery between 0 and 5),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_minute int not null check (start_minute between 0 and 1439),
  end_minute int not null check (end_minute between 1 and 1440),
  created_at timestamptz not null default now(),
  check (end_minute > start_minute)
);

create table if not exists unavailable_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references study_goals(id) on delete cascade,
  week_start date not null,
  source text not null default 'deterministico' check (source in ('deterministico','ia','manual')),
  explanation text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, goal_id, week_start)
);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references study_goals(id) on delete set null,
  schedule_id uuid references schedules(id) on delete set null,
  subject_id uuid references subjects(id) on delete set null,
  topic_id uuid references topics(id) on delete set null,
  date date not null,
  start_minute int not null,
  planned_minutes int not null,
  actual_minutes int not null default 0,
  kind text not null default 'estudo' check (kind in ('estudo','revisao','simulado')),
  status text not null default 'planejada' check (status in ('planejada','concluida','parcial','adiada','nao_realizada')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sessions_user_date on study_sessions(user_id, date);

-- ========================= Revisão espaçada =========================

create table if not exists review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  source_type text not null check (source_type in ('sessao','material','topico','manual')),
  source_id uuid,
  title text not null,
  due_date date not null,
  interval_days int not null default 0,
  ease real not null default 2.5,
  reps int not null default 0,
  lapses int not null default 0,
  state text not null default 'pendente' check (state in ('pendente','adiada','concluida')),
  last_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reviews_user_due on review_items(user_id, due_date);

create table if not exists review_history (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references review_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  result text not null check (result in ('facil','bom','dificil','nao_lembrei')),
  interval_before int not null,
  interval_after int not null
);

-- ========================= Materiais =========================

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null check (type in ('nota','link','arquivo','flashcard')),
  content_text text not null default '',
  url text not null default '',
  file_path text not null default '',
  file_size bigint not null default 0,
  mime_type text not null default '',
  subject_id uuid references subjects(id) on delete set null,
  visibility text not null default 'privado' check (visibility in ('privado','amigos','link','publico')),
  share_token text unique,
  share_enabled boolean not null default false,
  favorite boolean not null default false,
  archived boolean not null default false,
  source_material_id uuid references materials(id) on delete set null,
  source_user_id uuid references auth.users(id) on delete set null,
  origin_note text not null default '',
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_materials_user on materials(user_id);

create table if not exists material_tags (
  material_id uuid not null references materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  primary key (material_id, tag)
);

-- ========================= Amizade =========================

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente','aceite','recusado','cancelado')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (from_user, to_user)
);

create table if not exists friendships (
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists blocks (
  blocker uuid not null references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);

-- ========================= Questões e simulados =========================

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  statement text not null,
  type text not null default 'multipla' check (type in ('multipla','certo_errado')),
  options_json jsonb not null,
  correct_index int not null,
  explanation text not null default '',
  subject_id uuid references subjects(id) on delete set null,
  difficulty int not null default 3 check (difficulty between 1 and 5),
  source_name text not null default '',
  origin text not null default 'autoral' check (origin in ('autoral','ia','importada')),
  created_at timestamptz not null default now()
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references study_goals(id) on delete set null,
  title text not null,
  mode text not null default 'pratica' check (mode in ('pratica','simulado')),
  time_limit_seconds int not null default 0,
  shuffle boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists quiz_questions (
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  position int not null,
  primary key (quiz_id, question_id)
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  answered int not null default 0,
  correct int not null default 0,
  total int not null default 0,
  duration_seconds int not null default 0
);

create table if not exists quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  chosen_index int,
  is_correct boolean not null default false,
  seconds_spent int not null default 0,
  unique (attempt_id, question_id)
);

-- ========================= Gamificação =========================

create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  ref_table text not null,
  ref_id text not null,
  xp int not null,
  created_at timestamptz not null default now(),
  unique (event_type, ref_table, ref_id)
);

create table if not exists user_xp (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- ========================= Lembretes e fontes =========================

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('revisao','sessao')),
  time_minute int not null default 540,
  days_json jsonb not null default '[0,1,2,3,4,5,6]',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, kind)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  date date not null,
  read_at timestamptz,
  dedupe_key text,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_notifications_dedupe
  on notifications(user_id, dedupe_key) where dedupe_key is not null;

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references study_goals(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  name text not null,
  url text not null,
  status text not null default 'cadastrada' check (status in ('cadastrada','acessada','verificada')),
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ========================= RLS =========================
-- Estratégia base: cada linha pertence a um dono (user_id = auth.uid()).
-- Tabelas de relacionamento por par (friendships, blocks) usam o próprio usuário na linha.

do $$
declare
  t text;
  owner_tables text[] := array[
    'profiles','study_goals','subjects','topics','availability_slots','unavailable_dates',
    'schedules','study_sessions','review_items','review_history','materials','material_tags',
    'questions','quizzes','quiz_attempts','quiz_answers','xp_events','user_xp','achievements',
    'reminders','notifications','sources'
  ];
begin
  foreach t in array owner_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "owner_select" on %I', t);
    execute format('drop policy if exists "owner_modify" on %I', t);
    execute format(
      'create policy "owner_select" on %I for select using (user_id = auth.uid())', t
    );
    execute format(
      'create policy "owner_modify" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;

-- profiles usa user_id como chave; as políticas acima já o cobrem.

-- Materiais públicos: leitura permitida mesmo sem login (role anon).
drop policy if exists "public_read" on materials;
create policy "public_read" on materials
  for select using (visibility = 'publico' and archived = false);

-- Materiais visíveis para amigos (amizade aceita) — leitura:
drop policy if exists "friend_read" on materials;
create policy "friend_read" on materials
  for select using (
    visibility = 'amigos'
    and exists (
      select 1 from friendships f
      where (f.user_a = auth.uid() and f.user_b = materials.user_id)
         or (f.user_b = auth.uid() and f.user_a = materials.user_id)
    )
  );

-- Nota: o compartilhamento por link (share_token) é validado na camada de aplicação,
-- não por RLS, pois envolve um token opaco. Revise ao migrar.

-- friend_requests / friendships / blocks: cada parte pode ver e modificar as próprias linhas.
alter table friend_requests enable row level security;
drop policy if exists "fr_party" on friend_requests;
create policy "fr_party" on friend_requests
  for all using (from_user = auth.uid() or to_user = auth.uid())
  with check (from_user = auth.uid() or to_user = auth.uid());

alter table friendships enable row level security;
drop policy if exists "friendship_party" on friendships;
create policy "friendship_party" on friendships
  for all using (user_a = auth.uid() or user_b = auth.uid())
  with check (user_a = auth.uid() or user_b = auth.uid());

alter table blocks enable row level security;
drop policy if exists "blocks_owner" on blocks;
create policy "blocks_owner" on blocks
  for all using (blocker = auth.uid()) with check (blocker = auth.uid());

alter table quiz_questions enable row level security;
drop policy if exists "quiz_questions_owner" on quiz_questions;
create policy "quiz_questions_owner" on quiz_questions
  for all using (
    exists (select 1 from quizzes q where q.id = quiz_questions.quiz_id and q.user_id = auth.uid())
  )
  with check (
    exists (select 1 from quizzes q where q.id = quiz_questions.quiz_id and q.user_id = auth.uid())
  );
