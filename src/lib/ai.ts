/**
 * Camada adaptadora de IA — 100% opcional.
 *
 * Se AI_PROVIDER/AI_API_KEY não estiverem configurados, qualquer chamada
 * lança NotConfiguredError e o sistema usa o motor determinístico local.
 * A chave jamais é exposta ao navegador: este módulo só roda no servidor.
 */

import { planSchedule, type PlannerInput, type PlannerOutput } from "./planner";

export class NotConfiguredError extends Error {
  constructor() {
    super("Provedor de IA não configurado.");
    this.name = "NotConfiguredError";
  }
}

export class ProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}

export function aiConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER && process.env.AI_API_KEY);
}

export function aiInfo(): { configured: boolean; provider: string; dailyLimit: number } {
  const raw = Number(process.env.AI_DAILY_LIMIT || 20);
  return {
    configured: aiConfigured(),
    provider: process.env.AI_PROVIDER || "nenhum",
    dailyLimit: Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 20,
  };
}

function geminiModel(): string {
  return process.env.AI_MODEL || "gemini-3.5-flash";
}

function geminiEndpoint(): string {
  return "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel() + ":generateContent";
}

async function callGemini(prompt: string, schema?: object): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await callGeminiOnce(prompt, schema);
    } catch (err) {
      const retryable =
        !(err instanceof NotConfiguredError) &&
        (!(err instanceof ProviderError) || !err.status || [502, 503, 504].includes(err.status));
      if (attempt === 0 && retryable) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }
      throw err;
    }
  }
  throw new ProviderError("Falha ao chamar o provedor de IA.");
}
async function callGeminiOnce(prompt: string, schema?: object): Promise<string> {
  if (!aiConfigured()) throw new NotConfiguredError();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const generationConfig: Record<string, unknown> = { temperature: 0.4 };
    if (schema) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = schema;
    } else {
      generationConfig.responseMimeType = "application/json";
    }
    const res = await fetch(geminiEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.AI_API_KEY || "",
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
      signal: controller.signal,
    });
    if (!res.ok) throw new ProviderError(`Provedor respondeu ${res.status}.`, res.status);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new ProviderError("Resposta vazia do provedor.");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

type AiSession = {
  date: string;
  startMinute: number;
  plannedMinutes: number;
  subjectName: string;
  kind: string;
  reason: string;
};

type AiPlan = { sessions: AiSession[]; explanation: string[] };

/**
 * Tenta sugerir um plano com IA. Em qualquer falha (sem chave, timeout,
 * limite, JSON inválido) retorna o plano determinístico local, sinalizando
 * a origem — a plataforma nunca fica inutilizável por causa da IA.
 */
export async function suggestSchedule(input: PlannerInput): Promise<PlannerOutput & { source: "deterministico" | "ia"; aiNote?: string }> {
  const fallback = planSchedule(input);
  if (!aiConfigured()) {
    return { ...fallback, source: "deterministico", aiNote: "IA não configurada; plano gerado pelo algoritmo local." };
  }
  try {
    const subjectNames = input.subjects.map((s) => s.name);
    const prompt = `Você é um planejador de estudos. Gere um plano para o usuário.
Disponibilidade (dia 0=domingo..6=sábado, minutos desde 00:00): ${JSON.stringify(input.availability)}
Matérias (nome, prioridade 1-5, domínio 0-5): ${JSON.stringify(input.subjects.map((s) => [s.name, s.priority, s.mastery]))}
Sessão de ${input.sessionMinutes} minutos. Meta semanal: ${input.weeklyHoursTarget}h. Hoje: ${input.today}. Prova: ${input.examDate ?? "sem data"}.
Responda SOMENTE JSON: {"sessions":[{"date":"AAAA-MM-DD","startMinute":0,"plannedMinutes":50,"subjectName":"...","kind":"estudo|revisao|simulado","reason":"..."}],"explanation":["..."]}.
Máximo 21 dias, respeite a disponibilidade e a lista de matérias: ${JSON.stringify(subjectNames)}.`;

    const text = await callGemini(prompt);
    const parsed = JSON.parse(text) as AiPlan;
    if (!Array.isArray(parsed.sessions)) throw new ProviderError("Resposta da IA sem campo sessions.");

    // Validação do servidor: só aceita sessões cujas matérias existem e datas são válidas.
    const byName = new Map(input.subjects.map((s) => [s.name, s.id]));
    const sessions = parsed.sessions
      .filter((s) => byName.has(s.subjectName) && /^\d{4}-\d{2}-\d{2}$/.test(s.date))
      .slice(0, 200)
      .map((s) => ({
        date: s.date,
        startMinute: Number(s.startMinute) || 0,
        plannedMinutes: Number(s.plannedMinutes) || input.sessionMinutes,
        subjectId: byName.get(s.subjectName)!,
        kind: (["estudo", "revisao", "simulado"].includes(s.kind) ? s.kind : "estudo") as "estudo" | "revisao" | "simulado",
        reason: typeof s.reason === "string" ? s.reason.slice(0, 300) : "Sugestão da IA.",
      }));
    if (sessions.length === 0) throw new ProviderError("IA não retornou sessões válidas.");

    return {
      sessions,
      explanation: (parsed.explanation ?? []).slice(0, 12).map((e) => String(e).slice(0, 300)),
      warnings: ["Plano sugerido por IA. Revise antes de salvar; a IA pode não conhecer seu edital."],
      source: "ia",
      aiNote: "Plano gerado com IA e validado pelo servidor.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido";
    return {
      ...fallback,
      source: "deterministico",
      aiNote: `IA indisponível (${msg}). Plano gerado pelo algoritmo local determinístico.`,
    };
  }
}

export type TutorContext = {
  user: { displayName: string };
  today: string;
  timezone: string;
  goal: { title: string; examName: string; examDate: string | null; weeklyHoursTarget: number } | null;
  subjects: { name: string; priority: number; mastery: number }[];
  sessions: { date: string; startMinute: number; plannedMinutes: number; subjectName: string | null; kind: string; status: string }[];
  reviewsDue: number;
  reviews: { title: string; dueDate: string; subjectName: string | null }[];
  materials: { title: string; type: string; subjectName: string | null }[];
  accuracy: { subjectName: string; correct: number; total: number }[];
  streak: number;
};

export type TutorReply = {
  reply: string;
  actions: Array<
    | { kind: "create_session"; payload: { date: string; startMinute: number; plannedMinutes: number; subjectName: string; kind: "estudo" | "revisao" | "simulado"; notes: string } }
    | { kind: "schedule_review"; payload: { title: string; subjectName: string | null; dueInDays: number } }
    | { kind: "create_goal"; payload: { title: string; examName: string; examDate: string | null; weeklyHoursTarget: number; sessionMinutes: number } }
  >;
};

export async function tutorChat(input: { context: TutorContext; history: Array<{ role: "user" | "assistant"; body: string }>; message: string }): Promise<TutorReply> {
  if (!aiConfigured()) throw new NotConfiguredError();
  const hist = input.history.slice(-12).map((h) => `${h.role === "user" ? "Usuário" : "Moriarty"}: ${h.body}`).join("\n");
  const prompt = `Você é Moriarty, tutor de estudos prático, direto e objetivo.
Responda em português do Brasil. Nunca invente dados sensíveis. NÃO execute ações sozinho: apenas proponha ações com dados concretos.
Contexto: ${JSON.stringify(input.context)}
Histórico recente:\n${hist || "(sem histórico)"}
Pergunta do usuário: ${input.message}

Responda APENAS JSON com este formato:
{"reply":"texto curto e útil","actions":[{"kind":"create_session|schedule_review|create_goal","payload":{...}}]}
Regras:
- Para create_session: payload deve ter date (AAAA-MM-DD), startMinute (int), plannedMinutes (int), subjectName, kind (estudo|revisao|simulado), notes.
- Para schedule_review: payload deve ter title, subjectName (ou null), dueInDays (int >=1).
- Para create_goal: payload deve ter title, examName, examDate (AAAA-MM-DD ou null), weeklyHoursTarget (int), sessionMinutes (int).
- Máximo 3 ações. Se não houver ação útil, retorne actions: [].
- Seja breve. Não use listas longas.`;
  const text = await callGemini(prompt);
  const parsed = JSON.parse(text) as TutorReply;
  if (!Array.isArray(parsed.actions)) parsed.actions = [];
  parsed.actions = parsed.actions.slice(0, 3);
  return parsed;
}

export type GeneratedQuestion = {
  statement: string;
  type: "multipla" | "certo_errado";
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
};

const questionGenSchema = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          statement: { type: "STRING" },
          type: { type: "STRING", enum: ["multipla", "certo_errado"] },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correctIndex: { type: "INTEGER" },
          explanation: { type: "STRING" },
          difficulty: { type: "INTEGER" },
        },
        required: ["statement", "type", "options", "correctIndex", "explanation", "difficulty"],
      },
    },
  },
  required: ["questions"],
} as const;

export async function generateQuestions(input: { subjectName: string; topic?: string; count: number; difficulty?: number }): Promise<GeneratedQuestion[]> {
  if (!aiConfigured()) throw new NotConfiguredError();
  const count = Math.min(Math.max(Math.trunc(input.count) || 3, 1), 10);
  const diff = input.difficulty ?? 3;
  const prompt = `Crie ${count} questões autorais para estudo, em português do Brasil, sobre a matéria "${input.subjectName}"${input.topic ? ` (tópico: ${input.topic})` : ""}.
Nível de dificuldade: ${diff}/5. Priorize clareza e aplicação prática.
Para múltipla escolha use 4 alternativas. Para certo/errado use ["Certo","Errado"].
Sempre inclua uma explicação breve. Marque corretamente correctIndex.
Responda APENAS JSON: {"questions":[...]} com os campos solicitados.`;
  const text = await callGemini(prompt, questionGenSchema as object);
  const parsed = JSON.parse(text) as { questions: GeneratedQuestion[] };
  const out = Array.isArray(parsed.questions) ? parsed.questions : [];
  return out.slice(0, count).map((q) => ({
    statement: String(q.statement).slice(0, 5000),
    type: q.type === "certo_errado" ? "certo_errado" : "multipla",
    options: Array.isArray(q.options) ? q.options.map((o) => String(o).slice(0, 500)) : [],
    correctIndex: Number(q.correctIndex) || 0,
    explanation: String(q.explanation).slice(0, 3000),
    difficulty: Math.min(Math.max(Number(q.difficulty) || diff, 1), 5),
  }));
}
