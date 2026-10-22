-- 0005 — Rate limiting das rotas de auth (login, cadastro, recuperação de senha).
--
-- Um bucket por chave (tipo:identificador). Cada falha incrementa `hits`;
-- a janela reinicia sozinha após `window_started_at` + janela configurada.
-- A data é TEXT ISO (padrão do projeto) e comparada lexicograficamente,
-- que equivale à comparação cronológica para timestamps UTC no mesmo formato.

create table if not exists auth_rate_limits (
  bucket text primary key,
  hits integer not null default 0,
  window_started_at text not null,
  updated_at text not null
);

create index if not exists auth_rate_limits_window_idx on auth_rate_limits (window_started_at);
