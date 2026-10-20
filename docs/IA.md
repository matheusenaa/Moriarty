# IA opcional

O Moriarty funciona **100% sem IA**. Todos os recursos essenciais têm um motor determinístico
local (cronograma em `src/lib/planner.ts`, revisão espaçada em `src/lib/srs.ts`, correção de
simulados em `src/lib/quiz.ts`). A IA é um extra que só entra em cena se configurada e só para
sugerir cronogramas.

## Como funciona

`src/lib/ai.ts` centraliza a integração:

- `aiConfigured()` retorna `false` se `AI_PROVIDER` ou `AI_API_KEY` estiverem vazios.
- `suggestSchedule(input)` tenta o provedor e, em **qualquer** falha — sem chave, timeout de 20s,
  erro HTTP, JSON inválido, resposta sem sessões válidas — retorna o plano **determinístico local**,
  informando a origem (`source: "deterministico"` e `aiNote`).
- A plataforma nunca fica inutilizável por causa da IA: o pior caso é o plano local.

## Provedor suportado

Atualmente, **Google Gemini** (endpoint `generativelanguage.googleapis.com`). Configure:

```env
AI_PROVIDER=gemini
AI_API_KEY=sua-chave
AI_MODEL=gemini-2.0-flash
AI_DAILY_LIMIT=20
```

- A chave é lida **apenas no servidor**; nunca é enviada ao navegador nem embutida no bundle.
- `AI_MODEL` aceita qualquer modelo compatível da API de geração de conteúdo.
- `AI_DAILY_LIMIT` documenta o limite pretendido por usuário (padrão 20).

## Dados enviados ao provedor

Ao usar IA para gerar o cronograma, os seguintes dados são enviados ao provedor:

- Horários disponíveis (dia da semana e minutos).
- Matérias com **nome**, prioridade e domínio autodeclarado.
- Duração da sessão, meta semanal, data de hoje e data da prova.

**Não** são enviados e-mail, senha, nome de exibição, username, materiais, questões,
respostas de simulados ou qualquer dado de terceiros. Ainda assim, revise a política de
privacidade do provedor antes de habilitar em produção com dados sensíveis.

## Validação da resposta

A resposta do modelo é tratada como **não confiável**:

- Só são aceitas sessões cuja matéria existe na lista do usuário e cuja data seja `AAAA-MM-DD`.
- Limite de 200 sessões; textos truncados.
- `kind` restrito a `estudo|revisao|simulado`.
- Se nada válido vier, o erro é tratado e o plano local é usado.

## Custos e limites

- A API do Gemini tem camadas gratuitas e pagas, com limites de requisições/minuto e por dia que
  **mudam com o tempo** — consulte a documentação oficial atual do provedor antes de dimensionar.
- O `AI_DAILY_LIMIT` do Moriarty é apenas uma constante de configuração/exibir intenção: **ainda
  não há contador persistente de chamadas por usuário** (ver lacunas). Enquanto isso, um uso
  intenso não é barrado pelo app.
- Timeout de 20s por chamada; falhas caem no fallback local, sem cobrar o usuário com erro.

## Lacunas (honestas)

1. **Sem contador real de uso de IA.** `AI_DAILY_LIMIT` não é aplicado por falta de uma tabela de
   consumo; se isso importar, implemente registro por usuário/dia antes de expor a chave.
2. **Sem geração de questões por IA** implementada neste escopo (o campo `origin = 'ia'` existe, mas
   a geração automática não). Qualquer questão marcada como IA deve ser revisada por humano — o app
   já exibe esse aviso na interface.
3. **Apenas Gemini.** Adicionar outro provedor exige um novo ramo em `src/lib/ai.ts`.
