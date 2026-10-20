# Relatório de Auditoria — Moriarty

> Continuidade da etapa "login + identidade de estudos + conteúdo inicial PMDF/PF/PRF".
> Data da auditoria: 2026-10-20. Auditoria feita **antes** de qualquer alteração desta etapa.

## 1. Estado inicial

- **Git:** a pasta **não é um repositório Git** (`fatal: not a git repository`). Não havia alterações locais a proteger via Git; nenhuma operação de reset/clean foi necessária ou executada.
- O projeto já existia e estava funcional antes desta etapa: `typecheck`, `lint`, `test` (33 testes) e `build` (22 rotas) passavam, conforme registrado na etapa anterior.
- Nenhum dado de usuário foi apagado ou recriado nesta etapa. A migração nova é **aditiva** (não destrutiva).

## 2. Stack efetivamente instalada

| Item | Valor |
|---|---|
| Runtime | Node v22.14.0 |
| Gerenciador | npm 10.9.2 |
| Framework | Next.js 15.5.28 (App Router, React Server Components) |
| React | 19.3.1 |
| Linguagem | TypeScript 6.0.3 |
| Estilo | Tailwind CSS v4 (`@theme` em `src/app/globals.css`) |
| Banco | SQLite via `better-sqlite3@13` (arquivo `./data/moriarty.db`) |
| Auth | própria: bcryptjs + JWT HS256 (`jose`) em cookie `moriarty_session` |
| Validação | Zod v4 |
| Testes | Vitest 5.0.5 |
| Lint | ESLint 9.39.4 (flat config) + `eslint-config-next` 16.4.2 |
| Ícones | lucide-react |
| Gráficos | recharts |

## 3. Comandos disponíveis

```
npm run dev        # next dev  (porta 3000)
npm run build      # next build
npm run start      # next start
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run db:migrate # node scripts/migrate.mjs  (idempotente)
```

## 4. Estrutura de rotas (App Router)

- **Públicas:** `/` (landing), `/entrar`, `/cadastro`, `/recuperar`
- **Pós-login:** `/onboarding`
- **Área logada `(app)`:** `/central`, `/plano`, `/revisoes`, `/materias`, `/biblioteca` (+ `/[id]`), `/questoes`, `/simulados` (+ `executar`, `resultado`), `/desempenho`, `/arquivo`, `/amigos`, `/perfil`
- **Compartilhamento externo:** `/compartilhado/[token]`
- **API:** `/api/arquivos/[id]`

## 5. Fluxo de autenticação atual (examinado)

- Login: `loginAction` em `src/actions/auth.ts`, formulário em `src/app/(auth)/entrar/page.tsx` (client component com `useActionState`).
- Cadastro: `/cadastro`. Recuperação: `/recuperar` (token de reset gerado no servidor; **envio de e-mail não implementado** — documentado em `docs/IA.md`/`docs/SEGURANCA.md`).
- Sessão: cookie HttpOnly `moriarty_session`, JWT HS256, 30 dias, `SameSite=Lax`, `Secure` em produção. Segredo em `.env.local` (`AUTH_SECRET`, gitignored).
- Logout: `logoutAction`. Redirecionamento pós-login: `/central` (se onboarded) ou `/onboarding`.
- **Login social:** não existe (não é prometido na interface).
- Token JWT **não** carrega perfil editável; perfil é lido do banco a cada request (`getCurrentUser`).

## 6. Textos com identidade de "investigação" (mapeados)

Encontrados em 8 pontos. Todos são vocabulário de **produto/identidade**, não conteúdo jurídico:

- `src/app/page.tsx:15` — "Escritório de estudos" (já neutro, mas "Deduza…" na linha 30)
- `src/app/page.tsx:30` — "Deduza o caminho até a sua prova."
- `src/app/page.tsx:40` — "Começar investigação"
- `src/app/onboarding/page.tsx:13` — "Primeiro caso"
- `src/app/onboarding/page.tsx:14` — "Configure sua investigação"
- `src/app/layout.tsx:5` — title "Central de Investigação de Estudos"
- `src/app/(auth)/layout.tsx:7` — "Área do investigador"
- `src/app/(app)/central/page.tsx:42` — "Central de Investigação"
- `src/lib/xp.ts:33-35` — ranks "Investigador", "Mestre da Dedução", "Lorde de Baker Street"
- `src/lib/xp.ts:64` — conquista "Casos abertos"
- `src/lib/xp.ts:69` — conquista "Três dias deduzindo"

## 7. Conteúdo de estudo — como é guardado hoje

- Materiais: tabela `materials` (por `user_id`), tipos `nota|link|arquivo|flashcard`, `visibility privado|amigos|link|publico`, `share_token`, cópia com atribuição (`source_material_id`).
- Questões: tabela `questions` (`origin autoral|ia|importada`), `quizzes`, `quiz_attempts`, `quiz_answers`.
- Revisão: `review_items` (SM-2) gerados a partir de sessão/material/tópico.
- **Não existia** nenhum conceito de "conteúdo mantido pela plataforma" (catálogo de sistema). Este é o principal gap para o pacote PMDF/PF/PRF.

## 8. Riscos e observações

1. **Migração por nome único:** `db.ts` e `scripts/migrate.mjs` aplicam o schema somente se `schema_migrations` não tiver `001_init`. Alterar `db/schema.sql` retroativamente **não** afeta bancos já migrados. → Solução desta etapa: migração **aditiva** `002_catalogo` aplicada separadamente, sem tocar em dados existentes.
2. **Sem rate limiting** no login (documentado, não resolvido nesta etapa).
3. **Sem envio de e-mail** para recuperação de senha (documentado).
4. **Sem contador real de IA**: campos `ai_generated`/`origin` existem, mas não há integração de IA externa; conteúdo inicial é autoral/legislação, coerente com a regra de não depender de serviço pago.
5. Direitos autorais: o pacote inicial é **autoral** (notas, questões, flashcards) + **legislação oficial** (CF/88) + **links para editais oficiais**. Nenhuma prova protegida é copiada.
6. `tokens`/segredos não estão no código; `.env.local` é gitignored.

## 9. Recursos já funcionais (preservar)

Cronograma determinístico, SM-2, XP/conquistas (idempotentes), biblioteca com compartilhamento e cópia com atribuição, questões/simulados, desempenho (gráficos), onboarding em 3 passos, perfil, amizade/bloqueio, exportação de dados, exclusão de conta.

## 10. Plano de correção/evolução desta etapa

1. **Redesign da tela de login** (etapa 2) — cena de estudos com fórmulas, trechos constitucionais (CF/88 arts. 5º, 37, 144 — texto conferido no Planalto), animações discretas com `prefers-reduced-motion`, painel duplo no desktop e simplificado no mobile. Sem quebrar o formulário/auth.
2. **Reorientar linguagem** (etapa 3) — trocar os 8 pontos mapeados + ranks/conquistas, sem tocar em termos jurídicos reais.
3. **Conteúdo inicial PMDF/PF/PRF** (etapa 4) — catálogo de sistema (tabelas novas `catalog_collections`/`catalog_items` via migração `002`), seed idempotente por `slug`, integração na **Biblioteca** (aba "Concursos") e página de coleção; ≥5 matérias, ≥5 notas, 10 questões autorais e 5 flashcards por trilha; ficha dos arts. 5º/37/144; status de fonte + data de verificação + link oficial.
4. **Correções e testes** (etapa 5) — teste de idempotência do seed e de que usuário comum não altera conteúdo de sistema; rodar typecheck/lint/test/build.
5. **Documentação** (etapa 6) — `CONTEUDO_INICIAL_CONCURSOS.md`, `PASSO_A_PASSO_MANUAL.md`, `PROXIMOS_PASSOS.md`, atualização de `README.md`/`CHANGELOG.md`/`.env.example`.

### Exceções preservadas (não alterar)

Termos jurídicos legítimos (por ex. "inquérito", "investigação criminal" em conteúdo de Direito), nomes oficiais de cargos/etapas de concurso, e o conteúdo didático. A troca de linguagem aplica-se apenas à **identidade do produto**.
