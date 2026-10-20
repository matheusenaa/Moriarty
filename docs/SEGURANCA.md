# Segurança e privacidade

Este documento descreve os controles implementados, como verificá-los e o que ainda falta. As
afirmações abaixo correspondem ao código em `src/`; o que não está implementado está listado em
**Lacunas** ao final.

## Modelo de ameaça resumido

- **Autorização horizontal** (usuário A acessar dados de B) é o risco central, pois tudo é
  multiusuário no mesmo banco.
- **Vazamento de conteúdo compartilhado** (material privado ou de amigos visível para quem não
  deveria).
- **Abuso de autenticação** (força bruta, enumeração de contas, sequestro de sessão).
- **Upload malicioso** (tipo/tamanho/nome).
- **Manipulação de cliente** (atribuir XP, notas ou resultados falsos).

## Controles implementados

### Isolamento por usuário

- Todas as funções em `src/lib/repo/*` recebem `userId` e filtram por `user_id` nas consultas.
- A central de acesso a materiais (`checkMaterialAccess`) decide entre dono, amigo, token e
  público; qualquer outro caso é negado.
- `tests/security.test.ts` verifica 12 cenários, incluindo tentativas de ler, alterar e excluir
  dados de outro usuário — todas devem falhar.

Verificação:

```bash
npm test
```

### Autenticação

- Senhas com bcrypt (custo 10). Requisitos mínimos: 8–128 caracteres, com letra e número.
- Sessão: JWT HS256 (`jose`), cookie `moriarty_session` com `HttpOnly`, `SameSite=Lax`,
  `Secure` em produção, validade de 30 dias, assinatura com `AUTH_SECRET` (mínimo 32 caracteres).
- Em produção, `AUTH_SECRET` ausente/curto faz o app lançar erro na primeira operação de sessão.
- Cadastro com e-mail existente responde com mensagem genérica; recuperação sempre responde
  “se o e-mail existir…”, sem confirmar a existência da conta.
- Recuperação: token aleatório de 32 bytes, armazenado como hash SHA-256, validade de 30 minutos,
  uso único (`consumePasswordReset`).

### Uploads

- Allowlist de MIME/extensão: PDF, PNG, JPG, WEBP, TXT, MD.
- Limite de 10 MB.
- Nome de arquivo aleatório (16 bytes) dentro de `uploads/<userId>/`.
- Servidos somente ao dono autenticado em `GET /api/arquivos/[id]`; sem URL pública permanente.

### Compartilhamento

- Padrão `privado`. `amigos` exige amizade **aceita** (solicitação pendente não conta).
- `link` exige token válido e usuário autenticado. `publico` é escolha explícita.
- Revogar o compartilhamento invalida o token imediatamente.
- Copiar material preserva a atribuição (`source_user_id`, `source_material_id`, `origin_note`) e
  **não** concede edição do original.

### Gamificação

- XP é registrado em `xp_events` com `UNIQUE (event_type, ref_table, ref_id)`; creditar o mesmo
  evento duas vezes é ignorado (`awardXp` retorna 0). O cliente não calcula nem envia XP.

### Banco

- Prepared statements em todas as consultas; nenhuma entrada é concatenada em SQL.
- `foreign_keys = ON` e `journal_mode = WAL`.

## Dados pessoais e LGPD

- **Finalidade:** operar a plataforma de estudos do próprio usuário.
- **Minimização:** coletamos apenas e-mail, senha (hash), nome de exibição, username e conteúdo
  que o usuário cria.
- **Direito de acesso/portabilidade:** botão **Exportar meus dados** no perfil baixa um JSON com
  todos os registros do usuário.
- **Direito de exclusão:** exclusão de conta marca `deleted_at` e encerra o acesso. Ver lacuna
  sobre apagamento físico.
- **Compartilhamento:** nunca automático; depende de ação explícita do usuário.

## Lacunas conhecidas (honestas)

1. **Sem rate limiting.** Cadastro, login e recuperação não têm limite de tentativas; há risco de
   força bruta. Recomenda-se um proxy (Nginx/Fail2ban, Cloudflare) ou middleware de limitação.
2. **Sem envio de e-mail.** O token de recuperação é escrito no log do servidor
   (`console.info`). Sem serviço de e-mail, o fluxo exige intervenção do administrador. **Os logs
   devem ser tratados como sensíveis.**
3. **Exclusão lógica.** `softDeleteUser` não apaga fisicamente o histórico. Se sua política exigir
   apagamento definitivo, implemente a remoção em cascata (as FKs já usam `ON DELETE CASCADE`).
4. **Uploads no filesystem.** Sem varredura antivírus; confie apenas em conteúdo próprio.
5. **Backups manuais.** Não há rotina automatizada no repositório.
6. **Sem CSP/headers de segurança explícitos.** Considere adicionar `Content-Security-Policy` e
   `X-Frame-Options` no `next.config.ts` ou no proxy.
7. **Sem verificação de e-mail.** Contas não confirmam posse do endereço de e-mail.
8. **Supabase/RLS** não foi executado nem testado (`supabase/migrations/0001_init.sql` é ponto de
   partida). Enquanto o backend for SQLite, a autorização depende exclusivamente da camada de
   repositório.
