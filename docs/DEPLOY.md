# Deploy do Moriarty

O Moriarty usa **SQLite em arquivo** e **uploads no filesystem**. Isso significa que o servidor
precisa de **disco persistente**. Plataformas serverless puras (Vercel, Netlify Functions, AWS
Lambda) **não são adequadas** sem trocar o banco por Postgres e o storage por um bucket — o
filesystem é efêmero e cada instância teria seu próprio banco.

Há também o binário nativo `better-sqlite3`, que exige ambiente Node (não edge).

## Opção 1 — VPS pequena (recomendada para custo/controle)

Uma VPS de 1 vCPU e 1 GB (Hetzner, Contabo, DigitalOcean, Oracle Free Tier) é suficiente para uso
pessoal ou de um grupo pequeno.

Passos:

```bash
# no servidor (Ubuntu 22.04+)
sudo apt update && sudo apt install -y nodejs npm nginx
sudo npm i -g pm2

git clone <seu-repositorio> /var/www/moriarty
cd /var/www/moriarty
npm ci
cp .env.example .env.local   # edite AUTH_SECRET e DATABASE_PATH
npm run build
npm run db:migrate
pm2 start npm --name moriarty -- start
pm2 save && pm2 startup
```

Nginx como proxy reverso (com HTTPS via Certbot):

```nginx
server {
  server_name moriarty.seudominio.com;
  client_max_body_size 12M;   # uploads de até 10 MB + folga

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

```bash
sudo certbot --nginx -d moriarty.seudominio.com
```

Riscos e cuidados:

- **Um único processo** (`pm2` em modo fork, sem cluster) para evitar escrita concorrente
  desnecessária no SQLite. WAL ajuda, mas não transforma SQLite em banco distribuído.
- Backup: copie `data/` e `uploads/` periodicamente. Com WAL ativo, prefira
  `sqlite3 data/moriarty.db ".backup backup.db"` ou pare o app antes de copiar.
- `uploads/` pode crescer; monitore disco.

## Opção 2 — Plataformas de container com volume

Railway, Render (plano pago com disco), Fly.io (volume) e Northflank suportam processos Node com
disco persistente. Configure:

1. Build: `npm ci && npm run build`
2. Start: `npm start`
3. Variáveis: `AUTH_SECRET`, `DATABASE_PATH=/data/moriarty.db`, opcionalmente as de IA.
4. **Volume persistente** montado em `/data` (banco) e `/app/uploads` (arquivos).
5. Execute `npm run db:migrate` no start (o app também migra sozinho na primeira conexão).
6. Health check em `/` (landing pública).

Atenção a free tiers: muitos suspenderam ou limitaram disco persistente; verifique a documentação
atual do provedor antes de contar com “grátis”.

## Opção 3 — Migrar para Supabase/Postgres

`supabase/migrations/` contém o esquema equivalente com RLS:
- `0001_init.sql` — contas (via Supabase Auth), planejamento, revisão, materiais, amizade, questões,
  gamificação, lembretes e fontes.
- `0002_catalogo.sql` — catálogo de concursos (somente leitura para clientes; escrito pelo backend).
- `0003_catalog_progress.sql` — progresso pessoal sobre o catálogo (RLS por dono).

O conteúdo do catálogo tem um seed portátil: `npm run db:seed:supabase` gera
`supabase/seed_catalogo.sql` a partir da **mesma fonte** do seed SQLite (`scripts/seed-catalog.mjs`),
pronto para colar no SQL Editor.

Para migrar de verdade é necessário:

1. Criar o projeto Supabase e aplicar as migrations (SQL Editor ou Supabase CLI).
2. Trocar `src/lib/db.ts` e `src/lib/repo/*` por um cliente Postgres (ex.: `pg` ou
   `@supabase/supabase-js`) filtrando por `user_id`/`auth.uid()`.
3. Substituir a autenticação própria pelo Supabase Auth (ou manter, usando service role com
   cuidado).
4. Mover uploads para o Supabase Storage e ajustar `/api/arquivos/[id]`.
5. Reexecutar os testes de isolamento com o novo backend.

A migration SQL **não é aplicada automaticamente** e não foi executada neste projeto; trate-a como
ponto de partida revisável. As colunas foram conferidas contra `db/schema.sql` (paridade de
nomes/constraints).

## Caminho online e grátis (Supabase + Render) — passo a passo

Esta é a rota recomendada para colocar **online e de graça** sem reescrever o app agora:
rodar o Moriarty como **processo Node** (não serverless) no Render, com **disco persistente**
para o SQLite e os uploads. O Supabase/IA entram como upgrades quando você quiser.

> Por que não Vercel/Netlify grátis? Elas são serverless: filesystem é efêmero e cada instância
> teria seu próprio banco. O Moriarty foi desenhado com SQLite em arquivo + `better-sqlite3`
> (binário nativo), que exigem um processo Node com disco.

### Etapa A — Subir o código para o GitHub

```bash
cd MORIARTY
git init
git add .
git commit -m "Moriarty"
# crie um repositório vazio no GitHub e:
git remote add origin https://github.com/SEU_USUARIO/moriarty.git
git push -u origin main
```

O `.gitignore` já ignora `.env.local`, `data/` e `uploads/` — segredos e dados locais **não** vão
para o repositório.

### Etapa B — Conta no Render e criação do Web Service

1. Crie uma conta em https://render.com (plano **Free**).
2. **New → Web Service** → conecte o repositório `moriarty`.
3. Configurações:
   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/`
   - **Instance Type:** Free
4. **Environment Variables** (aba Environment):
   - `AUTH_SECRET` = um segredo de 32+ caracteres (gere com o comando do README).
   - `DATABASE_PATH` = `/var/data/moriarty.db`
   - `APP_TIMEZONE` = `America/Sao_Paulo`
   - (opcional IA) `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_DAILY_LIMIT`.
5. **Disks** (aba Disks) → Add Disk:
   - **Mount Path:** `/var/data`
   - **Size:** 1 GB
   > O disco persistente guarda o SQLite. Guarde também os uploads: para isso, adicione um segundo
   > disk em `/app/uploads` (mesmo se o plano free não permitir dois disks, use um único disk em
   > `/var/data` e defina os uploads lá — ver nota abaixo).
6. **Deploy**. No primeiro boot o app aplica as migrations e o seed automaticamente
   (`src/lib/db.ts`), criando o banco em `/var/data/moriarty.db`.

> **Importante sobre uploads:** no código atual os arquivos vão para `./uploads`. Para usar o disco
> persistente, defina o diretório de uploads dentro do mount (ex.: um segundo disk em
> `/app/uploads`, ou um volume único e mover a pasta). Se preferir simplicidade no free tier,
> use o Moriarty sem uploads de arquivo e mantenha notas/links/flashcards — o resto funciona
> 100%.

### Etapa C — Rodar as migrations manualmente (opcional, recomendado)

No painel do Render, aba **Shell**, rode uma vez:

```bash
npm run db:migrate
```

O app também migra sozinho na primeira conexão, então isso é apenas uma verificação explícita.

### Etapa D — IA online (Gemini, plano gratuito)

1. Gere uma chave de API em https://aistudio.google.com/apikey (Google AI Studio tem camada grátis).
2. No Render → Environment, adicione:
   - `AI_PROVIDER=gemini`
   - `AI_API_KEY=sua-chave`
   - `AI_MODEL=gemini-2.0-flash`
   - `AI_DAILY_LIMIT=20`
3. Salve (o Render reinicia). A IA passa a sugerir cronogramas; em qualquer falha, o motor
   determinístico assume (o app nunca fica inutilizável). A chave fica **só no servidor**.

### Etapa E — (Futuro) Supabase para dados na nuvem

Quando quiser banco gerenciado e storage na nuvem:
1. Crie o projeto Supabase (free tier).
2. Rode `npm run db:seed:supabase` e aplique `supabase/migrations/*.sql` + `supabase/seed_catalogo.sql`
   no SQL Editor.
3. Siga a "Opção 3" acima para trocar a camada de dados (`src/lib/repo/*`) por Postgres/Supabase.
   As telas e os motores puros (`srs`, `planner`, `quiz`, `xp`) **não mudam**.

### Limites do plano free (verifique a documentação atual)

- O Render free **hiberna** o serviço após inatividade (primeiro acesso pode demorar ~30s).
- Disks no free tier têm limite de tamanho; para uso pessoal/pequeno grupo, 1 GB basta.
- Backups: exporte o banco pela própria tela de **Perfil → Exportar JSON** ou copie
  `/var/data/moriarty.db`.

## Checklist de produção

- [ ] `AUTH_SECRET` forte, único e fora do repositório (>= 32 caracteres).
- [ ] HTTPS ativo; cookie passa a `Secure` automaticamente com `NODE_ENV=production`.
- [ ] `DATABASE_PATH` e `uploads/` em volume persistente.
- [ ] Backup automatizado de `data/` e `uploads/`.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` verdes no deploy.
- [ ] Migrations do Supabase (`0001`–`0003`) e seed (`seed_catalogo.sql`) aplicados **se** estiver
      usando Postgres/Supabase.
- [ ] Limite de upload do proxy ≥ 12 MB.
- [ ] Logs sem segredos; o token de recuperação aparece no log por falta de e-mail configurado —
      proteja o acesso aos logs.
- [ ] Política de privacidade/termos se o app for público.
