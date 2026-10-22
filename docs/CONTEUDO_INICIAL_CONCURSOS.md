# Conteúdo inicial de concursos

Documento de curadoria do conteúdo de sistema (catálogo) do Moriarty: PMDF, Polícia Federal e PRF.
Descreve a arquitetura, as regras de integridade/direitos autorais, o que foi incluído e como
manter/atualizar.

## Visão geral

O catálogo é **conteúdo de sistema**: aparece para todo usuário autenticado, não guarda progresso
pessoal e não pertence a nenhuma conta. O usuário pode **copiar** um item para a própria biblioteca
(criando um material privado), **agendar uma revisão** a partir dele ou **importar as matérias da
trilha** para o próprio plano — sem alterar o original.

- Rotas: `/biblioteca/concursos` (lista, com busca por texto/status) e `/biblioteca/concursos/[slug]`
  (trilha, com botão "Adicionar as matérias desta trilha ao meu plano").
- Fonte única do seed: [`scripts/seed-catalog.mjs`](../scripts/seed-catalog.mjs).
- Repositório de leitura: [`src/lib/repo/catalog.ts`](../src/lib/repo/catalog.ts) — inclui
  `searchCollections(query, status)`.
- Migração: [`db/migrations/002_catalogo.sql`](../db/migrations/002_catalogo.sql) (`catalog_collections`,
  `catalog_items`) e [`db/migrations/003_catalog_progress.sql`](../db/migrations/003_catalog_progress.sql)
  (`catalog_progress` — progresso pessoal, separado do conteúdo).
- Ações: [`src/actions/catalog.ts`](../src/actions/catalog.ts) (salvar na biblioteca / revisar amanhã /
  importar matérias / marcar progresso).

O seed é executado automaticamente na inicialização do banco (`src/lib/db.ts`) e por
`npm run db:migrate`. É **idempotente**: a chave única é `(collection_id, title, kind)`, então rodar
de novo insere 0 itens.

## Regras de integridade e direitos autorais

Este projeto **não reproduz provas nem apostilas protegidas**. O conteúdo segue três regras:

1. **Notas e flashcards são autorais** — resumos originais escritos para o projeto.
2. **Questões são autorais** — "geradas para prática, não oficiais". O enunciado, as alternativas,
   o gabarito e a explicação são de autoria própria; nenhuma questão de prova oficial é copiada.
   Cada questão carrega `origin_note = "Autoral/gerada para prática — NÃO é questão oficial."`
3. **Legislação é citação literal identificada por artigo** — por exemplo CF/88 arts. 5º, 37 e 144,
   sempre com link para o texto oficial.

Status e data de verificação são **sempre** visíveis. Nada é rotulado como "vigente" sem fonte
oficial confirmada.

### Rótulos de status

| Status | Significado |
|---|---|
| `vigente` | Há fonte oficial confirmada para o cargo/edital. |
| `historico` | Material baseado no último edital oficial localizado, sem certame novo confirmado. |
| `comum` | Tema útil, ainda não confirmado em edital de cargo específico. |
| `aguardando` | Fonte não pôde ser aberta/confirmada. |

## Coleções incluídas

| Slug | Título | Status | Edital de referência | Fonte |
|---|---|---|---|---|
| `pmdf-cfo` | PMDF — Oficial / CFO | `historico` | Edital nº 03/2025 – DGP/PMDF | Cebraspe |
| `pf-policial-2025` | Polícia Federal — Carreira Policial | `vigente` | Edital nº 1 - PF - Policial, de 20/05/2025 | PF / Cebraspe |
| `prf-policial` | PRF — Policial Rodoviário Federal | `historico` | Edital Concurso PRF nº 1, de 18/01/2021 | PRF / Cebraspe |

Cada coleção contém:

- **Matérias da trilha** (kind `area`) — mapa de disciplinas conforme o edital de referência.
- **Notas de estudo** (kind `nota`) — resumos autorais, incluindo a **ficha constitucional**
  compartilhada (CF/88, arts. 5º, 37 e 144).
- **Flashcards** (kind `flashcard`) — frente/verso para revisão espaçada.
- **Questões de treino** (kind `questao`) — autorais, com 5 alternativas, gabarito e explicação.

Total: **6 coleções / 165 itens** (PMDF CFO, PF Policial 2025, PRF, PCDF Agente/Investigador,
PMDF Soldado e Polícia Penal).

## Estrutura de dados

`catalog_collections`: `slug` (único), `title`, `summary`, `status`, `status_note`, `source_name`,
`source_url`, `edital_ref`, `checked_at`.

`catalog_items`: `collection_id`, `kind` (`area|nota|flashcard|questao|fonte`), `category`
(`oficial|resumo_proprio|questao_autoral|flashcard|fonte_externa`), `title`, `body`, `options_json`,
`correct_index`, `explanation`, `origin_note`, `ref_label`, `url`, `sort_order`.

`catalog_progress`: `user_id`, `item_id` (FK → `catalog_items`, `ON DELETE CASCADE`), `state`
(`lido|dominado`), `UNIQUE(user_id, item_id)`. Guarda apenas o **progresso do usuário**; exclusões
no conteúdo limpam o progresso automaticamente.

`catalog_answers`: `user_id`, `item_id` (FK → `catalog_items`), `chosen_index`, `is_correct`
(SMALLINT 0/1), `attempts`, `UNIQUE(user_id, item_id)`. Registra as respostas de treino das trilhas
(acerto/erro), alimenta o Desempenho e a ordenação "não respondidas / erradas primeiro".

As tabelas de conteúdo (`catalog_collections`, `catalog_items`) não possuem `user_id` nem colunas de
progresso (verificado por teste) — o progresso vive em `catalog_progress`.

## Como atualizar o conteúdo

1. Edite `scripts/seed-catalog.mjs` (títulos dos itens existentes são a chave — mudar o título cria
   um novo item; para alterar o corpo de um item, mantenha o título e edite `body`/`explanation`).
   As trilhas novas ficam em `scripts/conteudo-trilhas.mjs` e o conteúdo expandido em
   `scripts/conteudo-extra.mjs`.
2. Atualize `CHECKED_AT` e o `status`/`statusNote` quando reverificar as fontes.
3. Rode `npm run db:migrate` (ou apenas confie no seed automático ao subir o app).
4. Rode `npm test` — `tests/catalog.test.ts` valida as invariantes no banco e
   `tests/conteudo.test.ts` (roda **sem banco**) valida o conteúdo: metadados das 6 trilhas,
   `edital_ref`/`checked_at` sempre preenchidos, links apenas em domínios oficiais, flashcards no
   formato Frente/Verso, questões autorais com gabarito e aviso de "não é questão oficial",
   ausência de prova vazada e **frescor da revisão** (o teste falha se `CHECKED_AT` passar de
   180 dias — é a rotina de revisão periódica).
5. Em produção, **roda o seed** para gravar o conteúdo novo: botão em `/admin` (ou em `/perfil`),
   ou `POST /api/admin/seed` com o header `x-seed-token`. O seed é idempotente: itens novos são
   inseridos e os existentes não são duplicados.

> Migrações são aplicadas **uma vez por nome** (`schema_migrations`). Alterar `db/schema.sql`
> retroativamente **não** afeta bancos já migrados; para conteúdo novo use uma migração aditiva.

## Adicionar uma nova coleção

Inclua um objeto em `COLLECTIONS` com `slug`, `title`, `summary`, `status`, `statusNote`, `source`,
`editalRef`, `areas` e `items`. O seed cria a coleção e os itens automaticamente. Um novo concurso
pode reaproveitar `constitutionalNote` como nota compartilhada.
