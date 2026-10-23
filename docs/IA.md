# IA opcional

O Moriarty funciona **100% sem IA**. Todos os recursos essenciais têm um motor determinístico
local (cronograma em `src/lib/planner.ts`, revisão espaçada em `src/lib/srs.ts`, correção de
simulados em `src/lib/quiz.ts`). A IA é um extra: cronograma, tutor online por chat e geração
de questões para revisão humana.

## Como funciona

`src/lib/ai.ts` centraliza a integração:

- `aiConfigured()` retorna `false` se `AI_PROVIDER` ou `AI_API_KEY` estiverem vazios.
- `suggestSchedule(input)` tenta o provedor e, em **qualquer** falha — sem chave, timeout de 20s,
  erro HTTP, JSON inválido, resposta sem sessões válidas — retorna o plano **determinístico local**,
  informando a origem (`source: "deterministico"` e `aiNote`).
- `tutorChat(...)` responde no widget flutuante com contexto do próprio usuário e pode **propor**
  ações (sessão, revisão, objetivo). Nada é executado sem confirmação.
- `generateQuestions(...)` cria rascunhos de questões. O usuário revisa e salva manualmente; o
  registro é gravado com `origin = 'ia'` e fonte “Gerada por IA — revisada pelo usuário”.
- A plataforma nunca fica inutilizável por causa da IA: o pior caso é o recurso ficar oculto/offline.

## Configuração

Atualmente, **Google Gemini** (endpoint `generativelanguage.googleapis.com`). Configure:

```env
AI_PROVIDER=gemini
AI_API_KEY=sua-chave
AI_MODEL=gemini-2.5-flash
AI_DAILY_LIMIT=20
```

- A chave é lida **apenas no servidor**; nunca é enviada ao navegador nem embutida no bundle.
- `AI_MODEL` aceita qualquer modelo compatível da API de geração de conteúdo.
- `AI_DAILY_LIMIT` é aplicado de verdade por usuário/dia na tabela `ai_usage` (migração 0009).
  0 ou inválido cai no padrão 20; cada mensagem de chat ou geração conta 1 chamada.

## Tutor online

- Widget flutuante disponível em todas as páginas autenticadas, com minimizar e histórico.
- O contexto enviado inclui apenas dados do próprio usuário: objetivo ativo, matérias,
  sessões dos próximos 14 dias, revisões pendentes, índice de materiais, taxa de acerto e sequência.
- **Nunca** são enviados e-mail, senha, nome de usuário, amigos, mensagens de chat, arquivos,
  respostas de simulados ou qualquer dado de terceiros.
- A resposta do modelo é tratada como não confiável. Ações propostas passam por validação no
  servidor: matéria precisa pertencer ao usuário, datas/horários precisam ser válidos, limites de
  duração são aplicados, conflitos de agenda são recusados e no máximo 3 ações são aceitas.
- A IA não executa nada sozinha: cada ação aparece como cartão com **Confirmar** ou **Descartar**.
  A confirmação é novamente validada e registrada em `agent_actions`.

## Geração de questões

- A IA gera rascunhos (múltipla escolha ou certo/errado) a partir de uma matéria/tópico do usuário.
- O servidor valida enunciado, alternativas, gabarito e dificuldade antes de exibir.
- O rascunho **não** é salvo automaticamente: o usuário revisa e clica em Salvar.
- Questões de IA nunca são apresentadas como oficiais.

## Custos e limites

- A API do Gemini tem camadas gratuitas e pagas, com limites que mudam com o tempo — consulte a
  documentação oficial atual do provedor antes de dimensionar.
- O Moriarty consome 1 chamada por mensagem/geração, com teto diário em `AI_DAILY_LIMIT`.
- Timeout de 20s por chamada; falhas retornam erro amigável e não alteram dados.

## Lacunas (honestas)

1. **Sem streaming.** O tutor responde de uma vez; a janela mostra “pensando” durante a chamada.
2. **Apenas Gemini.** Adicionar outro provedor exige um novo ramo em `src/lib/ai.ts`.
3. **Sem busca em texto completo de materiais.** O tutor recebe apenas títulos/tipos recentes,
   não o conteúdo dos arquivos.
4. **Revisão humana obrigatória para questões.** Não há geração automática de simulados completos.
