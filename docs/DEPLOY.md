# Deploy do Moriarty — rota online e grátis (Supabase + Render/Vercel)

O Moriarty agora usa **PostgreSQL** (driver `pg`) como banco e mantém **autenticação própria**
(bcrypt + jose). Isso permite hospedar **de graça** usando:

- **Supabase** → banco PostgreSQL gerenciado (free tier).
- **Render** (processo Node) ou **Vercel** (serverless) → o app.

> Por que não SQLite local? O Postgres local está bloqueado nesta máquina (sem admin para instalar
> o serviço). Por isso usamos o **Postgres na nuvem** do Supabase — que também é o banco de
> produção. Os mesmos passos servem para desenvolver/testar e para publicar.

---

## Visão geral do que vamos fazer

1. Criar conta e projeto no **Supabase** (banco na nuvem).
2. Copiar a **connection string** (Session Pooler).
3. Colar essa string no arquivo **`.env.local`** do projeto (e no **`.env.test`** para testes).
4. Rodar **`npm run db:migrate`** (cria as tabelas + conteúdo inicial de concursos).
5. Rodar **`npm test`** (valida isolamento/segurança direto no Postgres do Supabase).
6. Publicar o app no **Render** (recomendado no free) ou **Vercel**.

---

## Etapa 1 — Criar conta e projeto no Supabase

Tudo pelo navegador, sem instalar nada e sem senha de administrador.

1. Abra **https://supabase.com** e clique em **Start your project** (canto superior direito).
2. Faça login com **GitHub** (mais rápido) ou com e-mail/senha. É grátis.
3. No painel, clique em **New project**.
4. Preencha o formulário **Create a new project**:
   - **Organization:** escolha a sua (se não existir, ele cria uma com o seu nome).
   - **Name:** `moriarty` (ou o nome que quiser).
   - **Database Password:** clique em **Generate a password** e **GUARDE ESSA SENHA**
     (você vai usá-la na connection string). Copie para um lugar seguro agora.
   - **Region:** escolha **South America (São Paulo)** para menor latência no Brasil.
   - **Pricing Plan:** **Free**.
5. Clique em **Create new project** e aguarde ~2 minutos (ele provisiona o banco).

> Se aparecer um aviso de e-mail/verificação, conclua antes de continuar.

---

## Etapa 2 — Copiar a connection string (Session Pooler)

1. Abra o seu projeto no painel do Supabase (`https://supabase.com/dashboard/project/_`).
2. No **topo da página**, ao lado do nome do projeto, clique no botão **Connect**.
   - Se não achar: menu lateral → **Database** → **Settings**, ou **Project Settings → Database**.
3. Na janela **Connect to your project**, escolha a aba **Session pooler**.
   - No free tier, o host direto (`db.xxxx.supabase.co`) é IPv6 e pode não aceitar conexões
     IPv4. O **Session pooler** funciona sempre.
4. Clique em **Copy**. Você verá algo assim (exemplo — os valores são seus):

   ```
   postgresql://postgres.abcdefghijklm:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```

5. Substitua `[YOUR-PASSWORD]` pela senha que você gerou na Etapa 1.
   - Se a senha tiver caracteres especiais (`@`, `#`, `?`, `&`, espaço), eles precisam estar
     **codificados** (URL-encode). Para evitar dor de cabeça, gere uma senha só com letras e
     números: **Project Settings → Database → Reset database password**.

> Guarde essa string final. Ela é o seu `DATABASE_URL`.

---

## Etapa 3 — Preencher o `.env.local`

No seu computador, dentro da pasta do projeto `MORIARTY`:

1. Se ainda não existir, copie o exemplo:

   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Abra o `.env.local` no editor e ajuste as linhas (mantenha o restante):

   ```env
   # Segredo de sessão — gere um novo (veja abaixo) e cole aqui
   AUTH_SECRET=cole-aqui-um-segredo-aleatorio-de-32-mais-caracteres

   # Connection string do Supabase (Session Pooler) da Etapa 2
   DATABASE_URL=postgresql://postgres.abcdefghijklm:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

   APP_TIMEZONE=America/Sao_Paulo
   ```

3. Para gerar o `AUTH_SECRET`, rode no terminal (dentro da pasta do projeto):

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Copie a saída e cole em `AUTH_SECRET=`.

4. Salve o arquivo. **Nunca** versione o `.env.local` (o `.gitignore` já o ignora).

---

## Etapa 4 — Criar as tabelas e o conteúdo inicial (migração)

No terminal, dentro da pasta do projeto:

```powershell
npm run db:migrate
```

O que esse comando faz:

- Lê o `DATABASE_URL` do `.env.local`.
- Aplica as migrações de `db/postgres/*.sql` (tabelas de contas, planejamento, revisão,
  materiais, amizade, questões, gamificação, catálogo de concursos...).
- Executa o **seed** do conteúdo inicial (6 trilhas: PMDF CFO, PF, PRF, PCDF Agente,
  PMDF Soldado e Polícia Penal) — idempotente, pode rodar de novo sem duplicar.

Saída esperada (algo parecido):

```
Migração aplicada: 001_init
Migração aplicada: 002_catalogo
Migração aplicada: 003_catalog_progress
Seed de conteúdo: 6 coleções, ... itens (inseridos: ...).
Banco pronto.
```

Para aplicar **somente** as migrações, sem o seed:

```powershell
npm run db:migrate -- --no-seed
```

### Se der `ETIMEDOUT` / a porta 5432 estiver bloqueada

Em redes corporativas (ou quando o Postgres local também está bloqueado), a porta **5432** pode
estar fechada e o comando acima falha com `connect ETIMEDOUT ...:5432`. Nesse caso, faça a migração
**pelo painel do Supabase** (usa HTTPS/443, que nunca é bloqueado):

1. Gere o arquivo SQL do conteúdo inicial (não precisa de banco):

   ```powershell
   npm run db:seed:sql
   ```

   Isso cria `db/postgres/seed_catalogo.sql`.

2. No painel do Supabase, menu lateral → **SQL Editor** → **+ New query**.

3. Para cada arquivo, nesta ordem, cole o conteúdo **inteiro** e clique em **Run**:
   - `db/postgres/0001_init.sql`
   - `db/postgres/0002_catalogo.sql`
   - `db/postgres/0003_catalog_progress.sql`
   - `db/postgres/0004_catalog_answers.sql`
   - `db/postgres/0005_auth_rate_limits.sql`
   - `db/postgres/0006_catalog_quiz_attempts.sql`
   - `db/postgres/0007_content_contributions.sql`
   - `db/postgres/seed_catalogo.sql` (o gerado no item 1)

   Cada um deve retornar **Success. No rows returned** (ou uma linha de contagem no seed).

4. Confira em **Table Editor** que as tabelas existem e que `catalog_collections` tem 6 linhas.

> A migração `0005_auth_rate_limits.sql` cria a tabela usada pelo **rate limiting** (proteção contra
> força bruta em login/cadastro/recuperação de senha). Se ela não for aplicada, o app continua
> funcionando — apenas sem os limites (o código detecta a tabela ausente e libera as operações).
> Para conferir se está aplicada, veja `GET /api/health`: o campo `rateLimits` deve mostrar
> `auth_rate_limits`.

> A migração `0006_catalog_quiz_attempts.sql` cria a tabela das **tentativas de simulado por
> trilha** (`catalog_quiz_attempts`). Sem ela, o botão "Fazer simulado da trilha" não funciona;
> o resto do app segue normal.

> Observação: o app em execução (Render/Vercel) também fala com o banco por TCP 5432. Se a porta
> estiver bloqueada **apenas na sua máquina** (firewall local), o deploy na nuvem funcionará normal.
> Se o bloqueio for da rede **do provedor de deploy**, use o *Transaction Pooler* (porta 6543) do
> Supabase como `DATABASE_URL`.

#### Alternativa sem SQL Editor: botão dentro do app

A forma mais simples de carregar o conteúdo no banco, sem terminal e sem colar SQL:

O app tem um **botão de administração** na página **Perfil**. Ele roda o seed no servidor (Vercel),
que tem acesso aberto ao banco — então funciona mesmo quando a porta 5432 está bloqueada na sua
rede. É idempotente: pode clicar quantas vezes quiser, não duplica nada.

Para habilitar (uma vez):

1. Na Vercel, em **Settings → Environment Variables**, adicione:
   - `ADMIN_EMAIL` = o **e-mail da sua conta** no Moriarty.
2. Faça **Redeploy** para a variável valer.
3. Abra o app → **Perfil** → card **“Administração — conteúdo das trilhas”** → clique em
   **“Carregar / atualizar conteúdo das trilhas”**.

Pronto: aparece a mensagem `Pronto: 3 trilhas e N itens no banco`.

> Só o e-mail definido em `ADMIN_EMAIL` vê esse card. Se `ADMIN_EMAIL` não estiver configurado, o
> card não aparece para ninguém (recurso desativado). Nada fica exposto publicamente.

---

#### Alternativa avançada (opcional): seed via endpoint com token

Se preferir automatizar por script (CI, terminal), existe também `POST /api/admin/seed`, protegido
pelo header `x-seed-token` (variável `SEED_TOKEN`). Sem `SEED_TOKEN`, retorna 404. Exemplo:

```powershell
curl.exe -X POST https://SEU-APP.vercel.app/api/admin/seed -H "x-seed-token: SEU_TOKEN"
```

---

## Etapa 5 — Rodar os testes contra o Postgres do Supabase

Como não há Postgres local, aponte os testes para um banco de teste no próprio Supabase.

1. No Supabase, crie um **segundo projeto** só para testes (ex.: `moriarty-test`) — ou, se
   preferir, reutilize o mesmo banco em um ambiente separado. Recomendado: projeto separado para
   não apagar seus dados de desenvolvimento.
2. Copie a connection string (Session Pooler) desse projeto de teste, igual à Etapa 2.
3. Edite o arquivo **`.env.test`** na raiz do projeto:

   ```env
   AUTH_SECRET=segredo-de-teste-somente-local-1234567890
   DATABASE_URL=postgresql://postgres.SEUPROJETOTESTE:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```

   > Nota: os testes **recriam as tabelas do zero** (DROP + migrações) no banco apontado por
   > `DATABASE_URL`. Por isso use um projeto **de teste**, nunca o de produção.

4. Rode:

   ```powershell
   npm test
   ```

   Os testes conectam no Supabase, aplicam migrações, semeiam o catálogo e verificam o isolamento
   de dados entre usuários.

> Se os testes falharem na conexão, verifique: (a) a senha está correta? (b) usou o **Session
> Pooler**? (c) o projeto do Supabase terminou de provisionar?

---

## Etapa 6 — Publicar o app

Escolha UMA das opções abaixo.

### Opção A — Render (processo Node, recomendado no free)

1. Suba o código para o GitHub (se ainda não subiu):

   ```powershell
   git add .
   git commit -m "Moriarty"
   git push
   ```

   > O `.env.local` e o `.env.test` **não** vão para o repositório (estão no `.gitignore`).

2. Crie uma conta em **https://render.com** (plano **Free**, login com GitHub).
3. Clique em **New +** → **Web Service**.
4. Conecte o repositório `moriarty` (autorize o acesso ao GitHub quando pedir).
5. Preencha a configuração:
   - **Name:** `moriarty`
   - **Region:** a mais próxima (Ohio/São Paulo, se disponível)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
6. Em **Environment** (variáveis de ambiente), adicione:
   - `AUTH_SECRET` = o mesmo segredo aleatório que você gerou (ou um novo).
   - `DATABASE_URL` = a connection string do Supabase (Session Pooler, do projeto de produção).
   - `APP_TIMEZONE` = `America/Sao_Paulo`
   - (opcional, IA) `AI_PROVIDER=gemini`, `AI_API_KEY=...`, `AI_MODEL=gemini-3.5-flash`,
     `AI_DAILY_LIMIT=20`
7. Clique em **Create Web Service** / **Deploy**.
8. O Render faz o build e sobe o app. Quando terminar, clique no link do topo
   (`https://moriarty-xxxx.onrender.com`).

> No primeiro acesso o Render free pode demorar ~30-50s (ele “acorda”). Depois fica rápido.

### Opção B — Vercel (serverless)

O app usa apenas Postgres (sem arquivos em disco), então funciona na Vercel.

1. Suba o código para o GitHub (igual à Opção A, passo 1).
2. Crie uma conta em **https://vercel.com** (login com GitHub).
3. Clique em **Add New...** → **Project**.
4. Selecione o repositório `moriarty` e clique em **Import**.
5. Antes de concluir, abra **Environment Variables** e adicione:
   - `AUTH_SECRET` = seu segredo aleatório.
   - `DATABASE_URL` = connection string do Supabase (Session Pooler).
   - `APP_TIMEZONE` = `America/Sao_Paulo`
   - `RESEND_API_KEY` = chave do Resend (e-mail de recuperação de senha) — opcional.
   - `EMAIL_FROM` = remetente, ex.: `Moriarty <onboarding@resend.dev>` — opcional.
   - `APP_URL` = URL pública do app, ex.: `https://moriarty-alpha.vercel.app` — opcional.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` = upload de arquivos
     (veja a seção abaixo) — sem elas o upload fica desativado com aviso na interface.
6. Clique em **Deploy**. Ao final, a Vercel mostra a URL pública do app.

### E-mail (Recuperação de senha) — Resend

Sem `RESEND_API_KEY` o app continua funcionando: a recuperação de senha registra o **token no log
do servidor** (modo manual). Com a chave, o usuário recebe o link por e-mail.

1. Crie a conta em **https://resend.com** e gere a chave em **API Keys** (`re_...`).
2. Na Vercel (ou Render), adicione as variáveis:
   - `RESEND_API_KEY` = a chave gerada;
   - `EMAIL_FROM` = remetente (padrão: `Moriarty <onboarding@resend.dev>`);
   - `APP_URL` = URL pública do app (é usada para montar o link do e-mail).
3. **Plano gratuito:** o Resend só envia para o e-mail do titular da conta. Para enviar para
   qualquer aluno, verifique um domínio no Resend e aponte `EMAIL_FROM` para ele
   (ex.: `Moriarty <nao-responda@seudominio.com.br>`).
4. Teste em `/recuperar`: informe um e-mail cadastrado e confira a caixa de entrada. O link leva
   direto ao formulário de nova senha (`/recuperar?token=...`), válido por 30 minutos e de uso único.

### Upload de arquivos — Supabase Storage

Na Vercel o disco do servidor é **efêmero e somente leitura**: arquivos enviados pelo usuário
sumiriam (ou o upload falharia) a cada novo deploy. Por isso o Moriarty usa o **Supabase Storage**
(bucket privado) quando as variáveis abaixo existem; sem elas, o app avisa na tela da Biblioteca
que o armazenamento é temporário e mantém notas, links, questões e flashcards funcionando.

1. No painel do Supabase, vá em **Storage → New bucket**:
   - Nome: `moriarty` (ou o que preferir — anote o nome).
   - **Public bucket**: **desmarcado** (o bucket é privado).
2. Em **Project Settings → API**, copie:
   - **Project URL** → `SUPABASE_URL` (ex.: `https://abcdefgh.supabase.co`);
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (é segredo: use apenas no servidor).
3. Na Vercel, adicione as três variáveis:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (nome do bucket).
4. Faça **Redeploy**. Na Biblioteca, o aviso "armazenamento temporário" deve sumir.
5. Limite de tamanho: **4 MB** por arquivo (teto do corpo da requisição na Vercel).
   Formatos aceitos: PDF, PNG, JPG, WEBP, TXT e MD.

> A `service_role` key **nunca** deve ser exposta ao navegador nem versionada. O código do
> Moriarty só a usa no servidor (`src/lib/storage.ts`).

> A Opção A (Render com disco, plano pago) também funciona. Notas, links, questões e flashcards
> nunca dependem de storage externo.

---

## Etapa 7 — Primeiro acesso e validação

1. Abra a URL pública do app.
2. Clique em **Criar conta** e cadastre-se.
3. Faça login, complete o **onboarding** e confira a **Biblioteca de concursos**
   (PMDF, PF, PRF devem aparecer).
4. Se algo der erro de banco, confira no Render/Vercel se `DATABASE_URL` e `AUTH_SECRET` foram
   salvos corretamente e faça um **redeploy**.

---

## Gerar um `AUTH_SECRET` (resumo)

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole a saída em `AUTH_SECRET` no `.env.local` e nas variáveis do Render/Vercel.

---

## Solução de problemas (FAQ)

- **`DATABASE_URL não configurada`** → o `.env.local` não existe ou a variável está vazia.
  Copie o `.env.example` e preencha.
- **`password authentication failed`** → a senha na connection string está errada ou não foi
  URL-codificada. Gere uma senha só com letras/números no Supabase e refaça a string.
- **`ENOTFOUND db.xxxx.supabase.co` / timeout** → use o **Session Pooler**, não o host direto.
- **Testes apagam tudo** → `npm test` recria as tabelas. Use um projeto Supabase **separado** para
  testes (`.env.test`).
- **Render hiberna** → normal no free; o primeiro acesso após inatividade demora ~30-50s.
- **Uploads somem na Vercel** → disco efêmero; use Render com disco (pago) ou Supabase Storage.

---

## Checklist de produção

- [ ] Conta no Supabase criada e projeto (produção) provisionado.
- [ ] `DATABASE_URL` (Session Pooler) no `.env.local`, no `.env.test` e nas envs do host.
- [ ] `AUTH_SECRET` forte (>= 32 caracteres), único e fora do repositório.
- [ ] `npm run db:migrate` executado no banco de **produção**.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` verdes.
- [ ] App publicado (Render ou Vercel) com HTTPS.
- [ ] Projeto Supabase **separado** para testes (não usar produção no `.env.test`).
- [ ] Backup: use **Perfil → Exportar JSON** ou os backups automáticos do Supabase.
- [ ] Logs sem segredos.
- [ ] Política de privacidade/termos se o app for público.
