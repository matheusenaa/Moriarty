# Changelog

Todas as mudanças relevantes do Moriarty. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não publicado]

### Adicionado

- **E-mail real de recuperação de senha (Resend)** (`src/lib/email.ts`): link direto para a troca de
  senha (`/recuperar?token=…`, 30 min, uso único), resposta genérica que não revela se a conta
  existe e queda para o modo manual (token no log) quando `RESEND_API_KEY` não está configurado.
- **Rate limiting anti-abuso nas rotas de auth** (migração `0005_auth_rate_limits.sql`,
  `src/lib/rate-limit.ts`): login (10 falhas por conta / 30 por IP em 15 min), cadastro (5/IP em 1 h)
  e recuperação de senha (3 por e-mail / 10 por IP em 1 h). Contadores por bucket em tabela
  própria, mensagens genéricas e degradação segura (o app não quebra) se a migração ainda não foi
  aplicada.
- **Upload de arquivos persistente (Supabase Storage)** (`src/lib/storage.ts`): bucket privado via
  REST, com fallback em disco local e aviso na Biblioteca quando o armazenamento é temporário
  (o disco da Vercel é efêmero). Caminhos validados contra travessia de diretório; o arquivo só é
  removido se nenhuma outra referência apontar para ele.
- **Conteúdo das 3 trilhas novas** (PCDF Agente, PMDF Soldado e Polícia Penal): 9 flashcards
  autorais adicionais; catálogo com **6 coleções e 165 itens**.
- **Testes de conteúdo** (`tests/conteudo.test.ts`, 15 testes, sem banco): metadados das trilhas,
  links oficiais, formato dos flashcards, gabaritos, regra de direitos autorais e revisão em
  180 dias.
- **Lembretes com efeito real:** o aviso "Hora da revisão"/"Hora da sessão de estudo" aparece no
  sino da plataforma quando o dia e o horário (±30 min) configurados no Perfil batem; a Central
  passa a mostrar a agenda de lembretes e o sino permite marcar um lembrete (ou todos) como lido.
- **Headers de segurança** (`next.config.ts`): `Content-Security-Policy`, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `Strict-Transport-Security`.
- **Testes de render de UI** (`tests/ui-catalog.test.tsx`, Testing Library + jsdom) e **guarda
  cliente/servidor** (`tests/fronteira-cliente-servidor.test.ts`).
- **Testes de render das páginas** (`tests/paginas.test.tsx`): as páginas de concursos e de trilha
  são renderizadas de verdade (ReactDOM server) com o repositório mockado.
- **Simulado por trilha** (`/biblioteca/concursos/[slug]/simulado`): sorteio aleatório das questões
  autorais, tempo limite, correção no servidor, resultado com percentual/tempo/explicação. As
  respostas alimentam o Desempenho. Novo `GET /api/health` agora também informa o modo de
  armazenamento de arquivos (`supabase`/`disco`) e se o bucket existe.
- **Contribuição de conteúdo com moderação** (`/contribuir`, `/admin/contribuicoes`): alunos sugerem
  notas/questões/flashcards para as trilhas; admins aprovam/rejeitam; itens aprovados entram no
  catálogo com atribuição de autoria. Nova tabela `content_contributions` (migração `0007`).

### Corrigido

- **Erro 500 nas páginas autenticadas:** funções exportadas por módulos `"use client"` estavam sendo
  chamadas em server components. `splitFlashcard` foi movida para `src/lib/flashcard.ts` e a guarda
  de fronteira cobre o caso.

### Alterado

- Limite de upload reduzido de 10 MB para **4 MB** (teto do corpo da requisição na Vercel) e
  `experimental.serverActions.bodySizeLimit` configurado.
- `GET /api/health` passou a informar também a presença da tabela `auth_rate_limits`.

## [0.2.0] — 2026-10-20

Reposicionamento da identidade para plataforma de estudos/concurso e conteúdo inicial de PMDF, PF e PRF. Nenhuma migração destrutiva: as mudanças são aditivas e preservam os dados existentes.

### Adicionado

- **Redesenho da tela de login** (`(auth)/layout.tsx`, `entrar`, `cadastro`): cena acadêmica decorativa
  (`src/components/AcademicScene.tsx`) com fórmulas e citações da CF/88, painel de destaque
  "Estude com método. Evolua com constância." e componente `PasswordField` (mostrar/ocultar senha).
  Classes de animação em `globals.css` com respeito a `prefers-reduced-motion`.
- **Biblioteca de concursos** (catálogo de sistema): rotas `/biblioteca/concursos` e
  `/biblioteca/concursos/[slug]`, exibindo matérias, notas, flashcards e questões de treino, com
  status, fonte oficial e data de verificação. Ações para salvar um item na biblioteca pessoal e
  agendar revisão (`src/actions/catalog.ts`), além de "Adicionar as matérias desta trilha ao meu
  plano" (idempotente por nome, vinculada ao objetivo ativo).
- **Busca e filtro de trilhas:** por texto (concurso, matéria ou tema) e por status, com ordenação
  por status (vigente antes de histórico) e contagens por tipo (`searchCollections`).
- **Progresso por trilha (migração `003_catalog_progress`):** o usuário marca notas como lidas e
  flashcards como dominados; a trilha mostra barra de progresso. O progresso é **dado pessoal** em
  tabela própria (`catalog_progress`), sem alterar o conteúdo de sistema (FK com `ON DELETE CASCADE`).
- **Conteúdo inicial (migração `002_catalogo`)**: tabelas `catalog_collections` e `catalog_items`;
  seed idempotente (`scripts/seed-catalog.mjs`) com **3 coleções e 80 itens** — PMDF (CFO), Polícia
  Federal (Edital nº 1/2025) e PRF (Edital nº 1/2021). Notas/flashcards autorais, questões autorais
  ("gerada para prática, não oficial") e ficha constitucional da CF/88 (arts. 5º, 37 e 144) citada
  por artigo com link para a fonte oficial.
- **Repositório de catálogo** (`src/lib/repo/catalog.ts`) — leitura independente de usuário, sem
  colunas de progresso pessoal.
- **Testes do catálogo** (`tests/catalog.test.ts`, 19 testes): trilhas presentes, fonte/status/data,
  quantidades mínimas, integridade das questões, busca/filtro, importação de trilha sem duplicação,
  progresso pessoal (marcar/atualizar/remover, isolamento entre usuários, contagem por coleção,
  cascata na exclusão do item), geração do seed Supabase, idempotência do seed e ausência de dados
  de usuário.
- **Migrações por nome** (`src/lib/db.ts` exporta `MIGRATIONS`) e seed automático na inicialização,
  com flag `--no-seed` em `scripts/migrate.mjs`.
- **Paridade Supabase/Postgres:** `supabase/migrations/0002_catalogo.sql` (catálogo global, leitura
  autenticada + escrita bloqueada) e `0003_catalog_progress.sql` (progresso com RLS por dono),
  alinhadas ao esquema SQLite. Seed portátil `scripts/seed-catalog-supabase.mjs`
  (`npm run db:seed:supabase`) gera `supabase/seed_catalogo.sql` da mesma fonte do seed SQLite.
- **Guia de deploy online grátis** (Supabase + Render com disco persistente + IA Gemini) em
  `docs/DEPLOY.md`.

### Alterado

- **Identidade do produto** de "investigação/detetive" para plataforma de estudos: textos de landing,
  onboarding, central, patentes e conquistas (`src/lib/xp.ts`). Termos jurídicos legítimos
  ("inquérito", "investigação social/criminal" em conteúdo de Direito) foram preservados.
- `npm run db:migrate` agora aplica migrações aditivas e carrega o conteúdo inicial (idempotente).

### Notas

- O `code` estável `"investigador"` em `src/lib/xp.ts` foi mantido por compatibilidade de dados/testes,
  embora o rótulo exibido tenha mudado.
- Nada é apresentado como "vigente" sem fonte oficial confirmada; datas de verificação registradas.

## [0.1.0] — 2026-10-20

Primeira versão funcional. Construída do zero (repositório iniciava vazio).

### Adicionado

- **Autenticação própria:** cadastro, login, logout, recuperação de senha (token hash SHA-256, uso
  único, 30 min) e exclusão de conta com confirmação. Senhas com bcrypt; sessão em JWT HS256
  (`jose`) via cookie `HttpOnly`/`SameSite=Lax`/`Secure`.
- **Onboarding** unificado (objetivo + matérias + disponibilidade).
- **Motor de cronograma determinístico** (`src/lib/planner.ts`): horizonte de 21 dias, respeito a
  disponibilidade, datas indisponíveis, prioridade/domínio, pausa de 10 min, teto de 6h/dia,
  reserva de 15% (revisões) e 5% (simulados), com explicação do plano.
- **Revisão espaçada** (`src/lib/srs.ts`, SM-2 simplificado): fatores de fácil/bom/difícil/não
  lembrei, ease 1.3–2.8, intervalos crescentes, histórico e rótulos de vencimento.
- **Matérias e tópicos** com prioridade, domínio, cor e arquivamento.
- **Central de estudos:** agenda do dia, concluir/adiar sessões, tempo real registrado.
- **Biblioteca de materiais:** notas, links, arquivos (allowlist PDF/PNG/JPG/WEBP/TXT/MD, até
  10 MB), etiquetas, favoritos, arquivamento e duplicação.
- **Compartilhamento consciente:** privado/amigos/link/público, token revogável, cópia com
  atribuição ao autor e sem acesso de edição ao original.
- **Questões e simulados:** banco autoral, montagem com filtro por matéria, embaralhamento com
  semente que preserva o gabarito, correção e relatório por matéria (`src/lib/quiz.ts`).
- **Desempenho:** gráficos de minutos planejados × realizados, acertos por matéria e tendência.
- **Arquivo público** com busca de materiais marcados como públicos.
- **Gamificação opcional** (`src/lib/xp.ts`): XP idempotente via `UNIQUE` em `xp_events`, patentes
  e conquistas; desativável.
- **Lembretes internos** (notificações no app).
- **Exportação de dados em JSON** no perfil.
- **Adaptador de IA opcional** (`src/lib/ai.ts`) para Gemini, com validação de resposta e fallback
  determinístico.
- **Testes Vitest:** motores de domínio (srs, planner, quiz, xp) e **12 testes de isolamento entre
  usuários** (autorização horizontal).
- **Documentação:** `README.md`, `docs/DEPLOY.md`, `docs/SEGURANCA.md`, `docs/IA.md`.
- **Alternativa PostgreSQL + RLS:** `supabase/migrations/0001_init.sql` (não aplicada
  automaticamente).

### Decisões de arquitetura

- **SQLite (`better-sqlite3`) + autenticação própria** em vez de Supabase, por indisponibilidade de
  credenciais externas no ambiente. Caminho de migração documentado.

### Correções durante a construção

- Ordem de restrições de tabela no `schema.sql` (SQLite exige `CHECK` de tabela após as colunas).
- `schema_migrations` criada antes da primeira consulta de migração.
- Configuração ESLint migrada para o formato flat nativo do `eslint-config-next` 16.
- Diversos ajustes de tipos (Zod `.issues`, exports de `ActionState`, generics do motor de quiz,
  tipos de retorno das server actions usadas em `<form>`).
