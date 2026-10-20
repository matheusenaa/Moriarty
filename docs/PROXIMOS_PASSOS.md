# Próximos passos

Backlog priorizado do Moriarty após o reposicionamento para plataforma de estudos e o conteúdo
inicial de concursos (PMDF, PF, PRF). Itens marcados **[bloqueado]** dependem de terceiros.

## Curto prazo (qualidade e confiança)

- **Testes de render na UI:** teste de render das páginas `/biblioteca/concursos` e `/[slug]` com
  Testing Library (hoje a cobertura é de repositório + lógica, não de JSX).
- **Verificação de conteúdo periódica:** rotina (checklist em `docs/CONTEUDO_INICIAL_CONCURSOS.md`)
  para revisar `status`/`checked_at` e atualizar `edital_ref` quando sair edital novo.
- **Mais trilhas:** adicionar concursos (ex.: PRF novo edital, PF por cargo específico, PM/PC
  estaduais) reaproveitando `constitutionalNote` e o seed idempotente.

## Médio prazo (produto)

- **Exportar trilha:** gerar PDF/roteiro de estudo a partir de uma coleção.
- **Contribuição de conteúdo:** fluxo com revisão para usuários sugerirem notas/questões, com
  atribuição e moderação (mantendo a regra de direitos autorais).

### Concluído

- Busca e filtro de trilhas (texto + status) — `searchCollections`.
- "Importar trilha para o plano" (cria matérias do usuário, idempotente por nome).
- Progresso por trilha (notas lidas / flashcards dominados) em `catalog_progress`.

## Longo prazo (plataforma)

- **PostgreSQL/Supabase:** aplicar `supabase/migrations/0001-0003` com RLS por usuário; reescrever
  `src/lib/repo/*` e a autenticação (telas e motores puros permanecem). Migrations e seed portátil
  já estão prontos; falta a troca da camada de dados.
- **Rate limiting e e-mail:** proteção anti-abuso nas rotas de auth; envio real do token de
  recuperação (hoje registrado no log do servidor).
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
