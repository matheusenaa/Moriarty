# Próximos passos

Backlog priorizado do Moriarty após o reposicionamento para plataforma de estudos e o conteúdo
inicial de concursos (PMDF, PF, PRF). Itens marcados **[bloqueado]** dependem de terceiros.

## Curto prazo (qualidade e confiança)

- **Testes de render na UI:** cobertura dos **componentes cliente das trilhas** em
  `tests/ui-catalog.test.tsx` (Testing Library + jsdom): virar flashcard, selecionar alternativa,
  ver gabarito/explicação, "você acertou/errou", "responder de novo", aviso de tentativa anterior e
  botões de progresso. Falta cobrir as **páginas** (server components) — exigem mock do
  `getCurrentUser`/banco ou o runner do Next.
- **Verificação de conteúdo periódica:** rotina automatizada em `tests/conteudo.test.ts` (roda sem
  banco) — valida metadados das 6 trilhas, `edital_ref`/`checked_at`, links oficiais, formato dos
  flashcards, gabaritos e a regra de direitos autorais. O teste **falha** se `CHECKED_AT` passar de
  180 dias, obrigando a reverificar as fontes. Ainda falta a conferência manual dos links/ediçais.
- **Mais trilhas:** adicionar concursos (ex.: PRF novo edital, PF por cargo específico, PM/PC
  estaduais) reaproveitando `constitutionalNote` e o seed idempotente.

## Médio prazo (produto)

- **Contribuição de conteúdo:** fluxo com revisão para usuários sugerirem notas/questões, com
  atribuição e moderação (mantendo a regra de direitos autorais).

### Concluído

- Busca e filtro de trilhas (texto + status) — `searchCollections`.
- "Importar trilha para o plano" (cria matérias do usuário, idempotente por nome).
- Progresso por trilha (notas lidas / flashcards dominados) em `catalog_progress`.
- Progresso por questão das trilhas (acerto/erro ao responder, revisão das erradas e estatísticas
  no Desempenho) em `catalog_answers`.
- Roteiro de estudo exportável por trilha (HTML imprimível para PDF + download `.md`).
- Agente de busca em fontes oficiais fixas (determinístico, sem IA paga) — 28 leis.
- Trilhas adicionais: PCDF Agente/Investigador, PMDF Soldado (praças) e Polícia Penal.
- Seed executável pela interface (botão em `/admin`), sem terminal e sem colar SQL.
- Testes de integridade do conteúdo (`tests/conteudo.test.ts`, sem banco) e flashcards nas trilhas
  novas (pcdf-agente, pmdf-soldado, policia-penal).
- Guarda da fronteira cliente/servidor (`tests/fronteira-cliente-servidor.test.ts`): impede que um
  server component chame função exportada por um módulo `"use client"` (quebra em runtime).
- Testes de render de UI (Testing Library + jsdom) nos componentes cliente das trilhas.
- E-mail real de recuperação de senha via Resend (`RESEND_API_KEY`), com link direto para a troca
  de senha (`/recuperar?token=...`) e queda para o modo manual quando a chave não existe.
- Rate limiting anti-abuso nas rotas de auth (login, cadastro, recuperação): contadores por conta
  e por IP com janelas fixas (`src/lib/rate-limit.ts`, tabela `auth_rate_limits`), mensagens
  genéricas que não revelam existência de conta e degradação segura quando a migração `0005` ainda
  não foi aplicada.
- Upload de arquivos persistente via Supabase Storage (`src/lib/storage.ts`): o disco da Vercel é
  efêmero, então os arquivos agora vão para um bucket privado; sem as variáveis
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_STORAGE_BUCKET` a interface avisa que o
  armazenamento é temporário. **Falta** criar o bucket no Supabase e cadastrar as variáveis na
  Vercel (ver `docs/DEPLOY.md`).
- Lembretes configurados no Perfil passaram a ter efeito: o aviso "Hora da revisão" / "Hora da
  sessão de estudo" aparece no sino da plataforma quando o dia e o horário (±30 min) batem, e a
  Central mostra a agenda configurada. O sino também permite marcar lembrete (ou todos) como lidos.

## Longo prazo (plataforma)

- **PostgreSQL/Supabase:** concluído — migrations `0001`–`0004` aplicadas, camada `src/lib/repo/*`
  reescrita com `pg`, autenticação própria e seed portable (`db/postgres/seed_catalogo.sql`).
  A migration `0005_auth_rate_limits.sql` está pronta e precisa ser aplicada no Supabase
  (SQL Editor) para ativar os limites; sem ela o app segue funcionando sem limites.
- **Lembretes por push/e-mail:** hoje apenas notificações internas (sino do app).
- **Internacionalização:** pt-BR hoje; separar strings para pt-BR/es/en.

## Débito técnico conhecido

- `code: "investigador"` em `src/lib/xp.ts` mantido por compatibilidade, embora o rótulo exibido
  tenha mudado — renomear exige migração de dados e revisão dos testes de XP.
- Exclusão de conta é lógica (`deleted_at`); avaliar apagamento físico conforme política de
  privacidade.
- `.mjs` do seed não é typechecked (apenas `allowJs` na importação); considera-se mover dados para
  `.ts` sob `src/` se a tipagem do conteúdo crescer.

## Rastreabilidade

- Auditoria e plano original: `docs/RELATORIO_AUDITORIA_MORIARTY.md`.
- Conteúdo e regras de direitos autorais: `docs/CONTEUDO_INICIAL_CONCURSOS.md`.
- Manual do usuário: `docs/PASSO_A_PASSO_MANUAL.md`.
