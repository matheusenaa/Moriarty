# Moriarty

Plataforma de estudos, revisão espaçada, simulados e compartilhamento de materiais — com uma
interface de arquivo vitoriano, em português do Brasil.

O Moriarty organiza a rotina de estudo em torno de um objetivo (concurso, prova, certificação),
gera um cronograma possível a partir da sua disponibilidade real, mantém uma fila de revisões
espaçadas, corrige simulados com relatório por matéria e permite compartilhar materiais com amigos
sem expor nenhum dado de progresso.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack e decisões de arquitetura](#stack-e-decisões-de-arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução local](#instalação-e-execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Comandos](#comandos)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Segurança e privacidade](#segurança-e-privacidade)
- [IA opcional](#ia-opcional)
- [Limitações conhecidas](#limitações-conhecidas)
- [Deploy](#deploy)

## Funcionalidades

- **Onboarding guiado:** objetivo, matérias e horários disponíveis em um único fluxo.
- **Meu plano:** cronograma determinístico de 21 dias, respeitando horários, datas
  indisponíveis, prioridade e domínio declarado de cada matéria; reserva 15% para revisões e 5%
  para simulados; pausa de 10 minutos entre sessões; máximo de 6 horas por dia.
- **Central de estudos:** o que fazer hoje, concluir/adiar sessões, registrar tempo real.
- **Revisão espaçada (SM-2 simplificado):** fila por vencimento, avaliação fácil/bom/difícil/não
  lembrei, intervalos crescentes e histórico.
- **Matérias e tópicos** com prioridade, domínio autodeclarado e arquivamento.
- **Biblioteca de materiais:** notas, links, arquivos (PDF/PNG/JPG/WEBP/TXT/MD, até 4 MB),
  etiquetas, favoritos, arquivamento e duplicação. Os arquivos ficam em bucket privado do
  Supabase Storage (com fallback temporário em disco).
- **Compartilhamento consciente:** privado (padrão), amigos (amizade aceita), link (usuário
  autenticado com o token) ou público (escolha explícita). Copiar preserva atribuição ao autor
  original e não dá acesso de edição ao original.
- **Questões e simulados:** banco de questões autorais, montagem de simulado com filtro por
  matéria, embaralhamento com semente, correção e relatório por matéria.
- **Desempenho:** minutos planejados × realizados, acertos por matéria e tendência em simulados.
- **Biblioteca de concursos:** trilhas iniciais (PMDF, Polícia Federal, PRF) com matérias, notas
  autorais, flashcards, questões de treino e a ficha constitucional (CF/88, arts. 5º, 37 e 144).
  Cada coleção mostra status (vigente/histórico), fonte oficial, data de verificação e permite
  salvar itens na biblioteca pessoal, agendar revisão, buscar/filtrar por tema ou status,
  **adicionar as matérias da trilha ao seu plano** em um clique e **acompanhar o progresso** (marcar
  notas como lidas e flashcards como dominados — dado pessoal, sem alterar o conteúdo). Todo
  conteúdo é autoral ou citação legislativa identificada — questões deixam claro que são geradas
  para prática, não oficiais.
- **Arquivo público:** materiais marcados como públicos, com busca.
- **Gamificação opcional:** XP idempotente, patentes (Aprendiz → Mestre) e conquistas; pode ser
  desativada nas preferências.
- **Tutor de IA opcional:** widget flutuante com avatar, histórico, cota diária e ações propostas
  (criar sessão, agendar revisão, criar objetivo) que exigem confirmação; geração de questões
  autorais com revisão humana antes de salvar.
- **Lembretes internos:** notificações no sino do app (sem promessa de e-mail ou push).
- **Conta:** exportação completa em JSON e exclusão de conta com confirmação explícita.

## Stack e decisões de arquitetura

- **Next.js 15 (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** (tokens em `src/app/globals.css`)
- **SQLite via `better-sqlite3`** — banco local, WAL, migração automática na inicialização
- **Autenticação própria:** senha com bcrypt (custo 10) + JWT HS256 (`jose`) em cookie
  `HttpOnly`, `SameSite=Lax`, `Secure` em produção, validade de 30 dias
- **Validação com Zod** e **server actions** para todas as mutações
- **Vitest** para testes de motores puros e de isolamento entre usuários

### Por que SQLite e autenticação própria?

O projeto não tinha credenciais de Supabase disponíveis no ambiente. Em vez de simular uma
integração que não poderia ser verificada, a implementação usa SQLite com autenticação própria —
totalmente funcional e testável — e mantém um caminho documentado para PostgreSQL/Supabase em
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), com RLS por usuário.

O acesso a dados é centralizado em `src/lib/repo/*` e **todas** as consultas filtram `user_id`.
A troca de banco exige reescrever essa camada e a autenticação, mas não as telas nem os motores de
domínio (`src/lib/srs.ts`, `planner.ts`, `xp.ts`, `quiz.ts`), que são puros.

## Pré-requisitos

- Node.js 20+ (testado com Node 22)
- npm 10+
- Windows, Linux ou macOS

> `better-sqlite3` é nativo. Em Windows, o pacote já vem com binários pré-compilados; se a
> instalação falhar, instale as Build Tools do Visual Studio ou use WSL.

## Instalação e execução local

```bash
npm install
cp .env.example .env.local        # no Windows: copy .env.example .env.local
# edite .env.local e defina AUTH_SECRET (>= 32 caracteres)
npm run dev
```

Abra http://localhost:3000, crie uma conta e conclua o onboarding. O banco é criado
automaticamente em `./data/moriarty.db`.

Gere um segredo com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `AUTH_SECRET` | sim (produção) | — | Segredo HS256, mínimo 32 caracteres. Em desenvolvimento há um fallback explícito, nunca use em produção. |
| `DATABASE_PATH` | não | `./data/moriarty.db` | Caminho do arquivo SQLite. |
| `APP_TIMEZONE` | não | `America/Sao_Paulo` | Fuso padrão de agrupamento de datas. |
| `AI_PROVIDER` | não | vazio | Provedor de IA (`gemini`). Vazio = motor determinístico. |
| `AI_API_KEY` | não | vazio | Chave do provedor, usada **apenas no servidor**. |
| `AI_MODEL` | não | `gemini-3.5-flash` | Modelo do provedor. |
| `AI_DAILY_LIMIT` | não | `20` | Limite diário de chamadas de IA por usuário. |

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm test` | Testes (Vitest, uma execução) |
| `npm run test:watch` | Testes em modo watch |
| `npm run db:migrate` | Aplica as migrações (`db/schema.sql`, `db/migrations/*`) e carrega o conteúdo inicial de concursos (idempotente). Use `--no-seed` para migrar sem semear. |
| `npm run db:seed:supabase` | Gera `supabase/seed_catalogo.sql` (seed do catálogo para Supabase/Postgres) a partir da mesma fonte do seed SQLite. |

## Testes

A suíte cobre os motores de domínio e o isolamento de dados:

- `tests/srs.test.ts` — intervalos, ease, lapsos e rótulos de vencimento
- `tests/planner.test.ts` — disponibilidade, janelas, priorização, datas bloqueadas
- `tests/quiz.test.ts` — embaralhamento que preserva o gabarito e correção
- `tests/xp.test.ts` — patentes e progresso
- `tests/security.test.ts` — **12 testes de autorização horizontal**: leitura, escrita e exclusão
  entre usuários, acesso a materiais privados/compartilhados, revogação, solicitação pendente vs.
  amizade aceita, XP idempotente, bloqueio e cópia com atribuição
- `tests/catalog.test.ts` — **18 testes do catálogo de concursos**: presença das três trilhas,
  fonte/status/data de verificação, quantidades mínimas, integridade das questões autorais,
  busca/filtro por texto e status, importação de trilha sem duplicação, progresso pessoal por item
  (isolamento, contagem e cascata) e ausência de colunas de usuário em conteúdo de sistema

Os testes de banco usam arquivos SQLite descartáveis em `data/test-*.db`.

## Estrutura do projeto

```
db/schema.sql              Esquema SQLite (migração 001)
db/migrations/             Migrações aditivas (ex.: 002_catalogo.sql)
scripts/migrate.mjs        Migração manual idempotente + seed do catálogo
scripts/seed-catalog.mjs   Conteúdo inicial de concursos (fonte única do seed)
src/app/                   Rotas (landing, auth, onboarding, app, api)
src/actions/               Server actions (validação + autorização + revalidação)
src/components/            Componentes de UI (client e primitivos)
src/lib/db.ts              Conexão SQLite, WAL, migrações e seed automático
src/lib/repo/              Repositórios com isolamento por user_id + catálogo
src/lib/srs.ts             Motor de revisão espaçada (puro)
src/lib/planner.ts         Motor de cronograma (puro, determinístico)
src/lib/quiz.ts            Embaralhamento e correção (puro)
src/lib/xp.ts              Patentes e progresso (puro)
src/lib/ai.ts              Adaptador de IA com fallback determinístico
tests/                     Testes Vitest
docs/                      Deploy, segurança, IA e conteúdo inicial
supabase/migrations/       Migrações PostgreSQL + RLS (0001 init, 0002 catalogo, 0003 progresso)
```

## Segurança e privacidade

Detalhes completos em [`docs/SEGURANCA.md`](docs/SEGURANCA.md). Resumo:

- Toda consulta e mutação passa por `user_id`; testes automatizados verificam isolamento.
- Senhas nunca são armazenadas em claro; recuperação usa token aleatório com hash SHA-256,
  validade de 30 minutos e uso único.
- Cookie de sessão `HttpOnly`/`SameSite=Lax`/`Secure` em produção, assinado com `AUTH_SECRET`.
- Uploads: allowlist de MIME e extensão, limite de 4 MB, nome aleatório, bucket privado
  (Supabase Storage) e servidos apenas ao dono autenticado via `/api/arquivos/[id]`; nunca há URL
  pública permanente.
- Rate limiting nas rotas de auth (por conta e por IP), com janelas fixas e degradação segura se a
  migração `0005` ainda não foi aplicada.
- Compartilhamento exige login por padrão; público só por escolha explícita.
- Respostas de cadastro e recuperação não revelam existência de conta.
- Consultas SQL usam prepared statements (sem concatenação de entrada).

**Lacunas conhecidas:** não há rate limiting dedicado nem envio de e-mail (o token de recuperação
é registrado no log do servidor para envio manual); a exclusão de conta é lógica (marca
`deleted_at` e encerra o acesso), preservando registros para integridade — documente e ajuste se
sua política de privacidade exigir apagamento físico.

## IA opcional

O app funciona 100% sem IA. Com `AI_PROVIDER=gemini` e `AI_API_KEY`, a geração de cronograma pode
usar o modelo; em qualquer falha, limite ou resposta inválida, o motor determinístico assume.
Com a IA configurada, também ficam disponíveis um tutor online flutuante (com ações que só são
aplicadas após confirmação) e a geração de questões para revisão humana. Cada usuário tem cota
diária configurável (`AI_DAILY_LIMIT`). Detalhes, dados enviados e custos em [`docs/IA.md`](docs/IA.md).

## Limitações conhecidas

- Banco único local: não é multiusuário distribuído; veja [`docs/DEPLOY.md`](docs/DEPLOY.md).
- Lembretes são internos (sino do app); não há push/e-mail.
- Uploads ficam em `./uploads` no filesystem — exige volume persistente no deploy.
- Não há importação automática de questões de terceiros (direitos autorais); o banco é autoral,
  importado manualmente ou gerado por IA com revisão humana obrigatória. O conteúdo inicial das
  trilhas de concursos segue a mesma regra: notas/flashcards autorais, questões autorais
  ("não oficiais") e legislação citada por artigo com link para a fonte oficial.
- Interface em pt-BR, sem i18n completa.

## Deploy

Guia com opções gratuitas/baratas, limites e riscos em [`docs/DEPLOY.md`](docs/DEPLOY.md).
Histórico de mudanças em [`CHANGELOG.md`](CHANGELOG.md).
