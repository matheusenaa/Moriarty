-- 0008 — Foto, frase, status tipo MSN no perfil + chat entre amigos.
--
-- Adiciona campos ao perfil e cria tabela de mensagens de chat.

-- Campos extras no perfil
alter table profiles
  add column if not exists photo_url TEXT,
  add column if not exists custom_phrase TEXT,
  add column if not exists user_status TEXT NOT NULL DEFAULT 'disponivel'
    CHECK (user_status IN ('ocupado', 'estudando', 'revisando', 'disponivel'));

-- Índice para busca por status
create index if not exists profiles_status_idx on profiles (user_status);

-- Tabela de mensagens de chat entre amigos
create table if not exists chat_messages (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT
);

create index if not exists chat_messages_from_idx on chat_messages (from_user_id, created_at desc);
create index if not exists chat_messages_to_idx on chat_messages (to_user_id, created_at desc);
create index if not exists chat_messages_conversation_idx on chat_messages (from_user_id, to_user_id, created_at desc);

-- Comentário: o chat usa polling (3-5s) no frontend; sem WebSocket para funcionar grátis no Vercel.
-- Para marcar como lida: UPDATE chat_messages SET read_at = now() WHERE to_user_id = $1 AND from_user_id = $2 AND read_at IS NULL;