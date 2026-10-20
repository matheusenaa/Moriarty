# Passo a passo — subir o Moriarty no seu computador

Guia manual, do zero até estudar, para Windows (com notas para Linux/macOS). Sem pressupor
conhecimento de programação.

## 1. Instalar o Node.js

1. Abra https://nodejs.org e baixe a versão **LTS** (20 ou superior).
2. Instale com as opções padrão ("Avançar" até o fim).
3. Para conferir, abra o **Prompt de Comando** (tecle `Win`, digite `cmd`, Enter) e rode:

   ```
   node -v
   npm -v
   ```

   Devem aparecer números de versão (ex.: `v22.x` e `10.x`).

## 2. Baixar o projeto

Se você recebeu a pasta do projeto, copie-a para um local simples, por exemplo
`C:\Users\seu-usuario\MORIARTY` (evite caminhos com acentos).

## 3. Instalar as dependências

No Prompt de Comando, entre na pasta do projeto:

```
cd C:\Users\seu-usuario\MORIARTY
npm install
```

Aguarde terminar (pode levar alguns minutos na primeira vez).

> **Se der erro de compilação do `better-sqlite3`:** instale as "Build Tools do Visual Studio"
> (opção "Desktop development with C++") e rode `npm install` de novo. Alternativa fácil: use WSL.

## 4. Criar o arquivo de configuração

1. Na pasta do projeto, copie o arquivo `.env.example` e renomeie a cópia para `.env.local`.
   Pelo Prompt de Comando:

   ```
   copy .env.example .env.local
   ```

2. Gere um segredo e copie o resultado:

   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Abra `.env.local` no Bloco de Notas e cole o segredo em `AUTH_SECRET=`, por exemplo:

   ```
   AUTH_SECRET=cole-aqui-o-segredo-gerado
   ```

4. Salve e feche.

## 5. Criar o banco e carregar o conteúdo de concursos

```
npm run db:migrate
```

Você verá mensagens como "Migração aplicada: 002_catalogo" e
"Seed de conteúdo: 3 coleções, 80 itens". O banco fica em `data\moriarty.db`.

## 6. Ligar o sistema

```
npm run dev
```

Abra o navegador em **http://localhost:3000**. Deixe o Prompt aberto (é o servidor).
Para desligar, volte ao Prompt e tecle `Ctrl + C`.

## 7. Usar o Moriarty

1. Na tela inicial, clique em **Começar a estudar** e faça o **cadastro** (e-mail e senha).
2. Siga o **onboarding**: escolha o objetivo, as matérias e os horários disponíveis.
3. Abra a **Central de Estudos** para ver o que fazer hoje.
4. Abra **Biblioteca → Biblioteca de concursos** para explorar PMDF, PF e PRF:
   - use a **busca** (por concurso, matéria ou tema) e o **filtro de status** para achar a trilha;
   - leia as notas, vire os flashcards, responda às questões de treino;
   - use **"salvar na minha biblioteca"** para levar um resumo para a sua coleção pessoal;
   - use **"revisar amanhã"** para colocar o item na fila de revisão espaçada;
   - use **"Adicionar as matérias desta trilha ao meu plano"** para criar as matérias do edital
     direto no seu plano (não duplica as que você já tem).

## 8. Comandos úteis

| Comando | Para quê |
|---|---|
| `npm run dev` | Ligar o sistema (desenvolvimento) |
| `npm run db:migrate` | Criar/atualizar banco e conteúdo (pode rodar sempre) |
| `npm test` | Rodar os testes automáticos |
| `npm run build` | Gerar a versão de produção |
| `npm start` | Rodar a versão de produção (após `build`) |

## 9. Problemas comuns

- **"AUTH_SECRET" ausente/curto** — confira o passo 4; o segredo precisa de 32+ caracteres.
- **Porta 3000 ocupada** — feche outro programa que a use ou rode `npm run dev -- -p 3001`.
- **Tela em branco após mudar algo** — pare (`Ctrl + C`) e rode `npm run dev` de novo.
- **Quero recomeçar do zero** — apague `data\moriarty.db` e rode `npm run db:migrate` novamente.

## 10. Sobre o conteúdo das trilhas

As notas, os flashcards e as questões são **autorais** (escritos para a plataforma); as questões são
"geradas para prática, não oficiais". Trechos de lei (CF/88) aparecem como citação identificada, com
link para a fonte oficial. Sempre confira o **edital mais recente** antes da prova — os status
indicam o que é referência histórica ou confirmado.
